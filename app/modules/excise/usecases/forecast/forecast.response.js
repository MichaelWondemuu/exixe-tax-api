import { BaseResponse } from '../../../../shared/responses/base.response.js';
import { FacilityResponse } from '../facility/facility.response.js';

export class ForecastResponse {
  static toResponse(row) {
    if (!row) return row;
    const e = row.get ? row.get({ plain: true }) : row;
    const response = {};
    BaseResponse.extendResponse(e, response);
    response.forecastNumber = e.forecastNumber;
    response.facilityId = e.facilityId;
    response.goodsCategory = e.goodsCategory;
    response.startMonth = e.startMonth;
    response.monthlyPlan = e.monthlyPlan;
    response.status = e.status;
    response.submittedAt = e.submittedAt;
    if (e.facility) {
      response.facility = FacilityResponse.toBrief(e.facility);
    }
    return response;
  }
}
