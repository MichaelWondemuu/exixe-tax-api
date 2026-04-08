import { yup } from '../../../shared/middleware/validate.middleware.js';
import { DELIVERY_NOTE_STATUS } from '../constants/excise.enums.js';

export const deliveryNoteBodySchema = yup.object({
  fromFacilityId: yup.string().uuid().required(),
  toFacilityId: yup.string().uuid().required(),
  shipmentRoute: yup.string().trim().max(255).nullable(),
  transporterName: yup.string().trim().max(255).nullable(),
  vehiclePlateNo: yup.string().trim().max(64).nullable(),
  expectedDispatchAt: yup.date().required(),
  expectedArrivalAt: yup.date().nullable(),
  items: yup
    .array()
    .of(
      yup.object({
        productDescription: yup.string().trim().min(1).max(255).required(),
        quantity: yup.number().positive().required(),
        unit: yup.string().trim().min(1).max(32).required(),
      }),
    )
    .min(1)
    .required(),
  remarks: yup.string().trim().max(5000).nullable(),
});

export const deliveryNoteStatusSchema = yup.object({
  status: yup.string().oneOf(Object.values(DELIVERY_NOTE_STATUS)).required(),
});

