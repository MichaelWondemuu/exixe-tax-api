import * as yup from 'yup';

/** Example: use with `validateBody(createBankAccountValidator)` when you add bank routes. */
export const createBankAccountValidator = yup.object({
  accountNumber: yup.string().required(),
  bankName: yup.string().required(),
  ownerName: yup.string().required(),
  ownerId: yup.string().required(),
  ownerType: yup.string().required(),
});
