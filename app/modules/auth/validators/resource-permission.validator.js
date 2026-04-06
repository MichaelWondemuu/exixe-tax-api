import * as yup from 'yup';

/** POST /resource-permissions */
export const createResourcePermissionBodySchema = yup.object({
  resourceId: yup.string().uuid().required(),
  permissionId: yup.string().uuid().required(),
  code: yup.string().trim().required(),
});

/** PUT /resource-permissions/:id */
export const updateResourcePermissionBodySchema = yup.object({
  resourceId: yup.string().uuid().optional(),
  permissionId: yup.string().uuid().optional(),
  code: yup.string().trim().optional(),
});
