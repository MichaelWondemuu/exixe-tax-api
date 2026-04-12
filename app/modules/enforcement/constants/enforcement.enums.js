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
