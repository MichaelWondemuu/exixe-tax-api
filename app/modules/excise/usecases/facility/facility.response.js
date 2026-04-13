import { BaseResponse } from '../../../../shared/responses/base.response.js';

export class FacilityResponse {
  static toResponse(facility) {
    if (!facility) return facility;
    const e = facility.get ? facility.get({ plain: true }) : facility;
    const response = {};
    BaseResponse.extendResponse(e, response);
    response.code = e.code;
    response.name = e.name;
    response.facilityType = e.facilityType;
    response.licenseNumber = e.licenseNumber;
    response.region = e.region;
    response.zone = e.zone;
    response.woreda = e.woreda;
    response.city = e.city;
    response.addressLine1 = e.addressLine1;
    response.addressLine2 = e.addressLine2;
    response.isActive = e.isActive;
    return response;
  }

  /** Nested facility on forecasts, delivery notes, stamp requests, etc. */
  static toBrief(facility) {
    if (!facility) return facility;
    const e = facility.get ? facility.get({ plain: true }) : facility;
    return {
      id: e.id,
      code: e.code,
      name: e.name,
      facilityType: e.facilityType,
    };
  }
}
