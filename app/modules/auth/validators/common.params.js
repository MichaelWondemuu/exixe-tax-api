import * as yup from 'yup';

export const idParamSchema = yup.object({
  id: yup.string().uuid().required(),
});

export const organizationIdParamSchema = yup.object({
  organizationId: yup.string().uuid().required(),
});

export const userPhoneParamSchema = yup.object({
  phone: yup.string().trim().min(1).required(),
});

export const walletTypeParamSchema = yup.object({
  organizationId: yup.string().uuid().required(),
  walletType: yup.string().trim().min(1).required(),
});

/** GET /system/organizations/users/:organizationID */
export const systemOrganizationUsersParamSchema = yup.object({
  organizationID: yup.string().uuid().required(),
});
