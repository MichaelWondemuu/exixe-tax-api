import { FACILITY_TYPES } from '../../excise/constants/excise.enums.js';
import { models } from '../../../shared/db/data-source.js';
import { HttpError } from '../../../shared/utils/http-error.js';
import { getUser } from '../../auth/middleware/user-context.js';

async function resolveOrganizationId(req, body) {
  const user = getUser(req);
  if (!user?.userId) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  if (user.isSystem) {
    const orgId = body.organizationId ?? null;
    if (!orgId) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'organizationId is required for system users',
      );
    }
    return orgId;
  }
  const orgId = user.organization?.id ?? null;
  if (!orgId) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'User organization is missing');
  }
  return orgId;
}

async function validateProductionReferences({
  organizationId,
  facilityId,
  productId,
  productVariantId,
}) {
  const facility = await models.ExciseFacility.findByPk(facilityId, {
    attributes: ['id', 'organizationId', 'facilityType'],
  });
  if (!facility) {
    throw new HttpError(404, 'NOT_FOUND', 'facilityId not found');
  }
  if (facility.organizationId !== organizationId) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'facilityId does not belong to organization',
    );
  }
  if (facility.facilityType !== FACILITY_TYPES.FACTORY) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'Only FACTORY facilities can record production',
    );
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
}

export class ProductionRecordCommandService {
  constructor({ productionRecordRepository }) {
    this.productionRecordRepository = productionRecordRepository;
  }

  create = async (req, body) => {
    const user = getUser(req);
    const organizationId = await resolveOrganizationId(req, body);

    await validateProductionReferences({
      organizationId,
      facilityId: body.facilityId,
      productId: body.productId,
      productVariantId: body.productVariantId ?? null,
    });

    return models.ProductionRecord.create({
      organizationId,
      facilityId: body.facilityId,
      productId: body.productId,
      productVariantId: body.productVariantId ?? null,
      lotOrBatchCode: body.lotOrBatchCode?.trim() || null,
      actualProducedQty: body.actualProducedQty,
      producedAt: body.producedAt,
      remarks: body.remarks ?? null,
      evidence: body.evidence ?? null,
      reportedByUserId: user.userId,
    });
  };

  patch = async (req, id, body) => {
    const user = getUser(req);
    const row = await models.ProductionRecord.findByPk(id);
    if (!row) {
      return null;
    }
    if (!user?.isSystem && row.organizationId !== user?.organization?.id) {
      throw new HttpError(403, 'FORBIDDEN', 'You cannot update this record');
    }

    const next = {
      organizationId: row.organizationId,
      facilityId:
        body.facilityId !== undefined ? body.facilityId : row.facilityId,
      productId: body.productId !== undefined ? body.productId : row.productId,
      productVariantId:
        body.productVariantId !== undefined
          ? body.productVariantId
          : row.productVariantId,
    };

    await validateProductionReferences(next);

    const patch = {};
    if (body.facilityId !== undefined) patch.facilityId = body.facilityId;
    if (body.productId !== undefined) patch.productId = body.productId;
    if (body.productVariantId !== undefined) {
      patch.productVariantId = body.productVariantId;
    }
    if (body.lotOrBatchCode !== undefined) {
      patch.lotOrBatchCode = body.lotOrBatchCode?.trim() || null;
    }
    if (body.actualProducedQty !== undefined) {
      patch.actualProducedQty = body.actualProducedQty;
    }
    if (body.producedAt !== undefined) patch.producedAt = body.producedAt;
    if (body.remarks !== undefined) patch.remarks = body.remarks;
    if (body.evidence !== undefined) patch.evidence = body.evidence;

    await row.update(patch);
    return this.productionRecordRepository.findById(req, id, {
      include: [
        { association: 'organization', required: false },
        { association: 'facility', required: false },
        { association: 'product', required: false },
        { association: 'productVariant', required: false },
        {
          association: 'reportedBy',
          required: false,
          attributes: { exclude: ['pinHash'] },
        },
      ],
    });
  };
}
