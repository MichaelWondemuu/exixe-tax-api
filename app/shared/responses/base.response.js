import { toPlain } from './mapper.util.js';

/** Matches persisted base fields from `getBaseFields()` plus optional legacy keys. */
const BASE_FIELD_KEYS = [
  'id',
  'organizationId',
  'organizationName',
  'branchId',
  'createdBy',
  'updatedBy',
  'deletedBy',
  'createdAt',
  'updatedAt',
  'deletedAt',
];

export class BaseResponse {
  static toResponse(entity) {
    const response = {};
    BaseResponse.extendResponse(entity, response);
    return response;
  }

  static extendResponse(entity, response) {
    if (!entity || !response || typeof response !== 'object') return response;
    const plain =
      typeof entity.get === 'function'
        ? entity.get({ plain: true })
        : typeof entity.toJSON === 'function'
          ? entity.toJSON()
          : entity;

    if (!plain || typeof plain !== 'object') return response;
    for (const key of BASE_FIELD_KEYS) {
      response[key] = plain[key];
    }
    return response;
  }

  /**
   * Merge canonical base fields onto a plain row (for formatResponse / raw Sequelize).
   * Objects without `id` are returned unchanged.
   */
  static enrichEntity(entity) {
    if (entity == null) return entity;
    if (typeof entity !== 'object' || entity instanceof Date) return entity;
    const plain = toPlain(entity);
    if (!plain || typeof plain !== 'object') return entity;
    if (!Object.prototype.hasOwnProperty.call(plain, 'id')) {
      return plain;
    }
    const baseSlice = {};
    BaseResponse.extendResponse(plain, baseSlice);
    return { ...plain, ...baseSlice };
  }
}
