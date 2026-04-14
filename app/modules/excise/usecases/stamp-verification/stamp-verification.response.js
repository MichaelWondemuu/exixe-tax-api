import { BaseResponse } from '../../../../shared/responses/base.response.js';
import { FacilityResponse } from '../facility/facility.response.js';

export class StampVerificationResponse {
  static toResponse(row) {
    if (!row) return row;
    const e = row.get ? row.get({ plain: true }) : row;
    const response = {};
    BaseResponse.extendResponse(e, response);
    response.verificationNumber = e.verificationNumber;
    response.facilityId = e.facilityId;
    response.actorType = e.actorType;
    response.channel = e.channel;
    response.result = e.result;
    response.stampIdentifier = e.stampIdentifier;
    response.productDescription = e.productDescription;
    response.buyingProductName = e.buyingProductName;
    response.supplierName = e.supplierName;
    response.supplierDocumentType = e.supplierDocumentType;
    response.supplierDocumentNumber = e.supplierDocumentNumber;
    response.verificationEvidence = e.verificationEvidence;
    response.remarks = e.remarks;
    response.merchantName = e.merchantName;
    response.address = e.address;
    response.city = e.city;
    response.region = e.region;
    response.woreda = e.woreda;
    response.latitude = e.latitude;
    response.longitude = e.longitude;
    response.shopInfoUpdateCount = e.shopInfoUpdateCount;
    response.shopInfoUpdatedAt = e.shopInfoUpdatedAt;
    response.verifiedAt = e.verifiedAt;
    if (e.facility) {
      response.facility = FacilityResponse.toBrief(e.facility);
    }
    return response;
  }
}
