export class BaseResponse {
  static toResponse(entity) {
    const response = new BaseResponse();
    response.id = entity.id;
    response.organizationId = entity.organizationId;
    response.branchId = entity.branchId;
    response.createdBy = entity.createdBy;
    response.updatedBy = entity.updatedBy;
    response.deletedBy = entity.deletedBy;
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    response.deletedAt = entity.deletedAt;
    return response;
  }

  static extendResponse(entity, response) {
    // Copy base entity fields
    response.id = entity.id;
    response.organizationId = entity.organizationId;
    response.branchId = entity.branchId;
    response.createdBy = entity.createdBy;
    response.updatedBy = entity.updatedBy;
    response.deletedBy = entity.deletedBy;
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    response.deletedAt = entity.deletedAt;
    return response;
  }
}

