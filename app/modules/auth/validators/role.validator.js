import * as yup from 'yup';

/** POST /roles */
export const createRoleBodySchema = yup.object({
  name: yup.string().trim().required(),
});

/** PUT /roles/:id */
export const updateRoleBodySchema = yup.object({
  name: yup.string().trim().optional(),
  isSystem: yup.boolean().optional(),
  roleScope: yup.string().oneOf(['BRANCH', 'ORGANIZATION']).optional(),
  organizationName: yup.string().trim().nullable().optional(),
});

/** POST /roles/:id/resource-permissions */
export const assignResourcePermissionsBodySchema = yup.object({
  resourcePermissionIds: yup.array().of(yup.string().uuid()).min(1).required(),
});
