import { HttpError } from '../../../../shared/utils/http-error.js';
import { models } from '../../../../shared/db/data-source.js';
import {
  STAMP_LABEL_TEMPLATE_LIFECYCLE_STATUS,
  STAMP_LABEL_TEMPLATE_RESOLVED_BY,
} from '../../constants/stamp-labels.enums.js';
import { ensureStampLabelSchema } from '../stamp-label/stamp-label.schema.js';

export class StampLabelTemplateQueryService {
  constructor({ stampLabelTemplateRepository }) {
    this.stampLabelTemplateRepository = stampLabelTemplateRepository;
  }

  list = async (req, query = {}) => {
    await ensureStampLabelSchema();
    return this.stampLabelTemplateRepository.findAllDetailed(req, query);
  };

  getById = async (req, id) => {
    await ensureStampLabelSchema();
    const entity = await this.stampLabelTemplateRepository.findByIdDetailed(req, id);
    if (!entity) {
      throw new HttpError(404, 'NOT_FOUND', 'Stamp template not found');
    }
    return entity;
  };

  resolveByStampRequestId = async (req, stampRequestId) => {
    await ensureStampLabelSchema();
    const stampRequest = await models.ExciseStampRequest.findByPk(stampRequestId, {
      attributes: ['id', 'productId', 'variantId', 'goodsCategory'],
    });
    if (!stampRequest) {
      throw new HttpError(404, 'NOT_FOUND', 'Stamp request not found');
    }

    const whereActive = {
      lifecycleStatus: STAMP_LABEL_TEMPLATE_LIFECYCLE_STATUS.ACTIVE,
    };

    let categoryId = null;
    if (stampRequest.productId) {
      const product = await models.Product.findByPk(stampRequest.productId, {
        attributes: ['id', 'categoryId'],
      });
      categoryId = product?.categoryId || null;
    } else if (stampRequest.goodsCategory) {
      const category = await models.Category.findOne({
        where: { name: String(stampRequest.goodsCategory).trim() },
        attributes: ['id'],
      });
      categoryId = category?.id || null;
    }

    if (stampRequest.variantId) {
      const byVariant = await models.StampLabelTemplate.findOne({
        where: {
          ...whereActive,
          resolvedBy: STAMP_LABEL_TEMPLATE_RESOLVED_BY.VARIANT,
          variantId: stampRequest.variantId,
        },
        include: [{ model: models.StampLabelTemplateSecurityFeature, as: 'securityFeatures' }],
      });
      if (byVariant) return byVariant;
    }

    if (stampRequest.productId) {
      const byProduct = await models.StampLabelTemplate.findOne({
        where: {
          ...whereActive,
          resolvedBy: STAMP_LABEL_TEMPLATE_RESOLVED_BY.PRODUCT,
          productId: stampRequest.productId,
        },
        include: [{ model: models.StampLabelTemplateSecurityFeature, as: 'securityFeatures' }],
      });
      if (byProduct) return byProduct;
    }

    if (categoryId) {
      const byCategory = await models.StampLabelTemplate.findOne({
        where: {
          ...whereActive,
          resolvedBy: STAMP_LABEL_TEMPLATE_RESOLVED_BY.CATEGORY,
          categoryId,
        },
        include: [{ model: models.StampLabelTemplateSecurityFeature, as: 'securityFeatures' }],
      });
      if (byCategory) return byCategory;
    }

    throw new HttpError(
      404,
      'NOT_FOUND',
      'No ACTIVE template found for stamp request by variant/product/category',
    );
  };
}
