import { BaseResponse } from '../../../../shared/responses/base.response.js';
import { FacilityResponse } from '../facility/facility.response.js';
import { StampRequestResponse } from '../stamp-request/stamp-request.response.js';

export class StampStockEventResponse {
  static toResponse(row) {
    if (!row) return row;
    const e = row.get ? row.get({ plain: true }) : row;
    const response = {};
    BaseResponse.extendResponse(e, response);
    response.eventNumber = e.eventNumber;
    response.eventType = e.eventType;
    response.status = e.status;
    response.relatedStampRequestId = e.relatedStampRequestId;
    response.sourceFacilityId = e.sourceFacilityId;
    response.targetFacilityId = e.targetFacilityId;
    response.reasonCode = e.reasonCode;
    response.quantity = e.quantity;
    response.notes = e.notes;
    response.evidenceUrl = e.evidenceUrl;
    response.requestedAt = e.requestedAt;
    response.approvedAt = e.approvedAt;
    response.approvedByUserId = e.approvedByUserId;
    response.completedAt = e.completedAt;
    response.rejectionReason = e.rejectionReason;
    response.meta = e.meta;
    if (e.sourceFacility) {
      response.sourceFacility = FacilityResponse.toBrief(e.sourceFacility);
    }
    if (e.targetFacility) {
      response.targetFacility = FacilityResponse.toBrief(e.targetFacility);
    }
    if (e.relatedStampRequest) {
      response.relatedStampRequest = StampRequestResponse.toRelatedBrief(
        e.relatedStampRequest,
      );
    }
    return response;
  }
}
