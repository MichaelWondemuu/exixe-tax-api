import * as yup from 'yup';

/** POST /resources */
export const createResourceBodySchema = yup.object({
  key: yup.string().trim().required(),
  name: yup.string().trim().required(),
});

/** PUT /resources/:id */
export const updateResourceBodySchema = yup.object({
  key: yup.string().trim().required(),
  name: yup.string().trim().optional(),
});
