/** Government excise self-registration enumerations (API + DB). */

export const ORGANIZATION_TYPES = Object.freeze([
  'MANUFACTURER',
  'IMPORTER',
  'DISTRIBUTOR',
]);

export const ADDRESS_PURPOSES = Object.freeze(['HQ', 'LEGAL', 'BILLING']);

export const FACILITY_TYPES = Object.freeze(['FACTORY', 'WAREHOUSE']);

/**
 * Attachment subject (spec: organization, facility, license).
 * Stored uppercase for consistency.
 */
export const ATTACHMENT_ENTITY_TYPES = Object.freeze([
  'ORGANIZATION',
  'FACILITY',
  'LICENSE',
]);

/** Workflow audit events (spec §9). */
export const APPROVAL_LOG_ACTIONS = Object.freeze([
  'SUBMITTED',
  'REVIEWED',
  'APPROVED',
  'REJECTED',
]);
