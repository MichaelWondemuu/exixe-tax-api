import * as yup from 'yup';

const scopeLevelEnum = yup
  .string()
  .oneOf(['ORGANIZATION', 'COUNTRY', 'REGION', 'ZONE', 'WOREDA', 'SECTOR']);

/** POST /users */
export const createUserBodySchema = yup.object({
  phone: yup.string().trim().required(),
  firstname: yup.string().trim().optional(),
  lastname: yup.string().trim().optional(),
  middlename: yup.string().trim().nullable().optional(),
  password: yup.string().optional(),
  pin: yup.string().optional(),
  accountId: yup.string().uuid().nullable().optional(),
  organizationId: yup.string().uuid().nullable().optional(),
});

/** PUT /users/:id */
export const updateUserBodySchema = yup.object({
  phone: yup.string().trim().optional(),
  accountId: yup.string().uuid().nullable().optional(),
  scopeLevel: scopeLevelEnum.optional(),
  scopeId: yup.string().nullable().optional(),
  scopeSectorIds: yup.array().of(yup.string().uuid()).nullable().optional(),
  sectorIds: yup.array().of(yup.string().uuid()).optional(),
});

/** POST /users/:id/roles */
export const assignRolesBodySchema = yup.object({
  roleIds: yup.array().of(yup.string().uuid()).min(1).required(),
});

/** POST /system/organizations/users */
export const createUserInOrganizationBodySchema = yup.object({
  organizationId: yup.string().uuid().required(),
  phone: yup.string().trim().required(),
  firstname: yup.string().trim().required(),
  lastname: yup.string().trim().required(),
  middlename: yup.string().trim().nullable().optional(),
  password: yup.string().optional(),
  pin: yup.string().optional(),
  isSystem: yup.boolean().optional(),
  isActive: yup.boolean().optional(),
  accountId: yup.string().uuid().nullable().optional(),
  scopeLevel: scopeLevelEnum.optional(),
  scopeId: yup.string().nullable().optional(),
  scopeSectorIds: yup.array().of(yup.string().uuid()).nullable().optional(),
  sectorIds: yup.array().of(yup.string().uuid()).optional(),
});
