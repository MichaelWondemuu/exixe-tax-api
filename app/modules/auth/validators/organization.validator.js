import * as yup from 'yup';

const orgTypeValues = ['MAIN', 'BRANCH', 'SUB_BRANCH', 'SISTER'];

const loose = () => yup.mixed().nullable().optional();

/** Detail / seller fields accepted by buildDetailPayload (camelCase). */
export const organizationDetailBodySchema = yup.object({
  city: loose(),
  sellerCity: loose(),
  email: loose(),
  sellerEmail: loose(),
  houseNumber: loose(),
  sellerHouseNumber: loose(),
  legalName: loose(),
  sellerLegalName: loose(),
  locality: loose(),
  sellerLocality: loose(),
  phone: loose(),
  sellerPhone: loose(),
  region: loose(),
  sellerRegion: loose(),
  subCity: loose(),
  sellerSubCity: loose(),
  tin: loose(),
  operatorType: loose(),
  operatorLicenseNumber: loose(),
  merchantId: loose(),
  merchantName: loose(),
  sellerTin: loose(),
  vatNumber: loose(),
  sellerVatNumber: loose(),
  wereda: loose(),
  sellerWereda: loose(),
  country: loose(),
  einvoiceCountry: loose(),
  serialNumber: loose(),
  einvoiceSerialNumber: loose(),
  systemNumber: loose(),
  systemType: loose(),
  lastInvoiceCounter: loose(),
  lastInvoiceReferenceNumber: loose(),
  lastReceiptReferenceNumber: loose(),
});

const organizationCoreCreateShape = {
  name: yup.string().trim().required(),
  tenantId: loose(),
  organizationType: yup.string().oneOf(orgTypeValues).optional(),
  parentId: yup
    .string()
    .uuid()
    .nullable()
    .when('organizationType', {
      is: (t) => t === 'BRANCH' || t === 'SUB_BRANCH',
      then: (s) =>
        s.required('parentId is required for BRANCH and SUB_BRANCH organizations'),
      otherwise: (s) => s.optional(),
    }),
  sisterOrgIds: yup.array().of(yup.string().uuid()).optional(),
  country: yup.string().optional(),
  regionId: loose(),
  zoneId: loose(),
  woredaId: loose(),
  latitude: loose(),
  longitude: loose(),
  sectorId: loose(),
  isActive: yup.boolean().optional(),
  expectedDailyTxnMin: loose(),
  expectedDailyTxnMax: loose(),
  expectedAvgTicketMin: loose(),
  expectedAvgTicketMax: loose(),
  expectedOpenTime: loose(),
  expectedCloseTime: loose(),
  riskThresholdPercent: loose(),
};

/** POST /organizations */
export const createOrganizationBodySchema = yup
  .object(organizationCoreCreateShape)
  .concat(organizationDetailBodySchema);

const organizationCoreUpdateShape = {
  name: yup.string().trim().optional(),
  tenantId: loose(),
  organizationType: yup.string().oneOf(orgTypeValues).optional(),
  parentId: yup.string().uuid().nullable().optional(),
  sisterOrgIds: yup.array().of(yup.string().uuid()).optional(),
  country: yup.string().optional(),
  regionId: loose(),
  zoneId: loose(),
  woredaId: loose(),
  latitude: loose(),
  longitude: loose(),
  sectorId: loose(),
  isActive: yup.boolean().optional(),
  expectedDailyTxnMin: loose(),
  expectedDailyTxnMax: loose(),
  expectedAvgTicketMin: loose(),
  expectedAvgTicketMax: loose(),
  expectedOpenTime: loose(),
  expectedCloseTime: loose(),
  riskThresholdPercent: loose(),
};

/** PUT /organizations/:id */
export const updateOrganizationBodySchema = yup
  .object(organizationCoreUpdateShape)
  .concat(organizationDetailBodySchema);

/** PUT /organizations/:organizationId/wallets */
export const upsertOrgWalletBodySchema = yup.object({
  walletType: yup.string().trim().required(),
  phone: yup.mixed().nullable().optional(),
  pin: yup.mixed().nullable().optional(),
  config: yup.mixed().optional(),
  active: yup.boolean().optional(),
});
