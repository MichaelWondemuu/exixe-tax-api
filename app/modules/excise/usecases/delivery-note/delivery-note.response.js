import { BaseResponse } from '../../../../shared/responses/base.response.js';
import { FacilityResponse } from '../facility/facility.response.js';

export class DeliveryNoteResponse {
  static toResponse(row) {
    if (!row) return row;
    const e = row.get ? row.get({ plain: true }) : row;
    const response = {};
    BaseResponse.extendResponse(e, response);
    response.noteNumber = e.noteNumber;
    response.fromFacilityId = e.fromFacilityId;
    response.toFacilityId = e.toFacilityId;
    response.shipmentRoute = e.shipmentRoute;
    response.transporterName = e.transporterName;
    response.vehiclePlateNo = e.vehiclePlateNo;
    response.expectedDispatchAt = e.expectedDispatchAt;
    response.expectedArrivalAt = e.expectedArrivalAt;
    response.status = e.status;
    response.items = e.items;
    response.remarks = e.remarks;
    response.approvedAt = e.approvedAt;
    response.dispatchedAt = e.dispatchedAt;
    response.receivedAt = e.receivedAt;
    if (e.fromFacility) {
      response.fromFacility = FacilityResponse.toBrief(e.fromFacility);
    }
    if (e.toFacility) {
      response.toFacility = FacilityResponse.toBrief(e.toFacility);
    }
    return response;
  }
}
