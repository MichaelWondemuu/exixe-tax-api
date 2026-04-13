import { BaseResponse } from '../../../../shared/responses/base.response.js';

export class ExciseConfigResponse {
  static toResponse(row) {
    if (!row) return row;
    const e = row.get ? row.get({ plain: true }) : row;
    const response = {};
    BaseResponse.extendResponse(e, response);
    response.key = e.key;
    response.value = e.value;
    response.description = e.description;
    response.isEditable = e.isEditable;
    return response;
  }
}
