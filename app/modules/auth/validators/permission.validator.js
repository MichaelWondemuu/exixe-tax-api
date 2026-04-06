import * as yup from 'yup';

/** POST /permissions */
export const createPermissionBodySchema = yup.object({
  code: yup.string().trim().required(),
  name: yup.string().trim().nullable().optional(),
});

/** PUT /permissions/:id */
export const updatePermissionBodySchema = yup.object({
  code: yup.string().trim().optional(),
  name: yup.string().trim().nullable().optional(),
});
