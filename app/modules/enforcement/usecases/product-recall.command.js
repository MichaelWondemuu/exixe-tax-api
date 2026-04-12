import { models } from '../../../shared/db/data-source.js';
import { HttpError } from '../../../shared/utils/http-error.js';
import { getUser } from '../../auth/middleware/user-context.js';
import { PRODUCT_RECALL_STATUS } from '../constants/enforcement.enums.js';

/**
 * @param {{
 *   productId: string;
 *   productVariantId?: string | null;
 *   effectiveFrom?: Date | string | null;
 *   effectiveTo?: Date | string | null;
 * }} params
 */
async function assertProductAndRelations(params) {
  const { productId, productVariantId, effectiveFrom, effectiveTo } = params;

  if (!productId) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'productId is required');
  }

  const product = await models.Product.findByPk(productId, { attributes: ['id'] });
  if (!product) {
    throw new HttpError(404, 'NOT_FOUND', 'productId not found');
  }

  if (productVariantId) {
    const variant = await models.ProductVariant.findByPk(productVariantId, {
      attributes: ['id', 'productId'],
    });
    if (!variant) {
      throw new HttpError(404, 'NOT_FOUND', 'productVariantId not found');
    }
    if (variant.productId !== productId) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'productVariantId does not belong to productId',
      );
    }
  }

  if (effectiveFrom && effectiveTo) {
    const a = new Date(effectiveFrom).getTime();
    const b = new Date(effectiveTo).getTime();
    if (a > b) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'effectiveFrom must be before or equal to effectiveTo',
      );
    }
  }
}

export class ProductRecallCommandService {
  constructor({ productRecallRepository }) {
    this.productRecallRepository = productRecallRepository;
  }

  create = async (req, body) => {
    const user = getUser(req);
    if (!user?.userId) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    await assertProductAndRelations({
      productId: body.productId,
      productVariantId: body.productVariantId ?? null,
      effectiveFrom: body.effectiveFrom ?? null,
      effectiveTo: body.effectiveTo ?? null,
    });

    return models.ProductRecall.create({
      title: body.title,
      description: body.description ?? null,
      productId: body.productId,
      productVariantId: body.productVariantId ?? null,
      lotOrBatchCode: body.lotOrBatchCode?.trim() || null,
      subjectOrganizationId: body.subjectOrganizationId ?? null,
      effectiveFrom: body.effectiveFrom ?? null,
      effectiveTo: body.effectiveTo ?? null,
      initiatedByUserId: user.userId,
      status: PRODUCT_RECALL_STATUS.DRAFT,
    });
  };

  patch = async (req, id, body) => {
    const row = await models.ProductRecall.findByPk(id);
    if (!row) {
      return null;
    }
    if (row.status !== PRODUCT_RECALL_STATUS.DRAFT) {
      throw new HttpError(
        400,
        'INVALID_STATE',
        'Only DRAFT recalls can be updated',
      );
    }

    const nextProductId =
      body.productId !== undefined ? body.productId : row.productId;
    const nextVariantId =
      body.productVariantId !== undefined
        ? body.productVariantId
        : row.productVariantId;
    const nextEffectiveFrom =
      body.effectiveFrom !== undefined ? body.effectiveFrom : row.effectiveFrom;
    const nextEffectiveTo =
      body.effectiveTo !== undefined ? body.effectiveTo : row.effectiveTo;

    await assertProductAndRelations({
      productId: nextProductId,
      productVariantId: nextVariantId,
      effectiveFrom: nextEffectiveFrom,
      effectiveTo: nextEffectiveTo,
    });

    const patch = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.productId !== undefined) patch.productId = body.productId;
    if (body.productVariantId !== undefined) {
      patch.productVariantId = body.productVariantId;
    }
    if (body.lotOrBatchCode !== undefined) {
      patch.lotOrBatchCode = body.lotOrBatchCode?.trim() || null;
    }
    if (body.subjectOrganizationId !== undefined) {
      patch.subjectOrganizationId = body.subjectOrganizationId;
    }
    if (body.effectiveFrom !== undefined) patch.effectiveFrom = body.effectiveFrom;
    if (body.effectiveTo !== undefined) patch.effectiveTo = body.effectiveTo;

    await row.update(patch);
    return this.productRecallRepository.findById(req, id, {
      include: [
        { association: 'product', required: false },
        { association: 'productVariant', required: false },
        { association: 'initiatedBy', required: false, attributes: { exclude: ['pinHash'] } },
        { association: 'subjectOrganization', required: false },
      ],
    });
  };

  publish = async (req, id) => {
    const row = await models.ProductRecall.findByPk(id);
    if (!row) {
      return null;
    }
    if (row.status !== PRODUCT_RECALL_STATUS.DRAFT) {
      throw new HttpError(400, 'INVALID_STATE', 'Only DRAFT recalls can be published');
    }
    await row.update({
      status: PRODUCT_RECALL_STATUS.PUBLISHED,
      publishedAt: new Date(),
    });
    return this.productRecallRepository.findById(req, id, {
      include: [
        { association: 'product', required: false },
        { association: 'productVariant', required: false },
        { association: 'initiatedBy', required: false, attributes: { exclude: ['pinHash'] } },
        { association: 'subjectOrganization', required: false },
      ],
    });
  };

  suspend = async (req, id) => {
    const row = await models.ProductRecall.findByPk(id);
    if (!row) {
      return null;
    }
    if (row.status !== PRODUCT_RECALL_STATUS.PUBLISHED) {
      throw new HttpError(
        400,
        'INVALID_STATE',
        'Only PUBLISHED recalls can be suspended',
      );
    }
    await row.update({ status: PRODUCT_RECALL_STATUS.SUSPENDED });
    return this.productRecallRepository.findById(req, id, {
      include: [
        { association: 'product', required: false },
        { association: 'productVariant', required: false },
        { association: 'initiatedBy', required: false, attributes: { exclude: ['pinHash'] } },
      ],
    });
  };

  close = async (req, id) => {
    const row = await models.ProductRecall.findByPk(id);
    if (!row) {
      return null;
    }
    if (
      row.status !== PRODUCT_RECALL_STATUS.PUBLISHED &&
      row.status !== PRODUCT_RECALL_STATUS.SUSPENDED
    ) {
      throw new HttpError(
        400,
        'INVALID_STATE',
        'Only PUBLISHED or SUSPENDED recalls can be closed',
      );
    }
    await row.update({ status: PRODUCT_RECALL_STATUS.CLOSED });
    return this.productRecallRepository.findById(req, id, {
      include: [
        { association: 'product', required: false },
        { association: 'productVariant', required: false },
        { association: 'initiatedBy', required: false, attributes: { exclude: ['pinHash'] } },
      ],
    });
  };
}
