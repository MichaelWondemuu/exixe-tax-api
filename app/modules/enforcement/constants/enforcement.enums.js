export const COUNTERFEIT_REPORT_STATUS = Object.freeze({
  SUBMITTED: 'SUBMITTED',
  REVIEWED: 'REVIEWED',
  ARCHIVED: 'ARCHIVED',
});

export const COUNTERFEIT_CASE_STATUS = Object.freeze({
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'CLOSED',
});

/** Lifecycle for suspicious-product reports (separate resource from counterfeit reports). */
export const SUSPICIOUS_PRODUCT_REPORT_STATUS = Object.freeze({
  SUBMITTED: 'SUBMITTED',
  REVIEWED: 'REVIEWED',
  ARCHIVED: 'ARCHIVED',
});

/** Product recall lifecycle (regulator-managed). */
export const PRODUCT_RECALL_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED',
});

/** Public-health / compliance impact level for a product recall. */
export const PRODUCT_RECALL_SEVERITY = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
});
