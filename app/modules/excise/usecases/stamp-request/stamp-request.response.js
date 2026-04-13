import { BaseResponse } from '../../../../shared/responses/base.response.js';
import { FacilityResponse } from '../facility/facility.response.js';

function toNonNegativeInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function mapWorkflowStage(status, generatedQuantity, printedQuantity, scanCount) {
  if (status === 'CANCELLED') return 'CANCELLED';
  if (status === 'REJECTED') return 'REQUEST_REJECTED';
  if (status === 'DRAFT') return 'REQUEST_DRAFT';
  if (status === 'SUBMITTED') return 'AWAITING_APPROVAL';
  if (status === 'APPROVED' && generatedQuantity <= 0) return 'APPROVED_PENDING_GENERATION';
  if (status === 'APPROVED' && generatedQuantity > 0 && printedQuantity <= 0) {
    return 'GENERATED_PENDING_PRINT';
  }
  if (printedQuantity > 0 && scanCount <= 0) return 'PRINTED_PENDING_USAGE';
  if (scanCount > 0) return 'IN_MARKET_VERIFICATION';
  if (status === 'FULFILLED') return 'FULFILLED';
  return 'ACTIVE';
}

function buildIntegratedLifecycle(e) {
  const requestedQuantity = toNonNegativeInt(e.quantity, 0);
  const generatedQuantity = toNonNegativeInt(e.generatedQuantity, 0);
  const printedQuantity = toNonNegativeInt(e.printedQuantity ?? e.generatedQuantity, 0);
  const distributedQuantity = toNonNegativeInt(e.distributedQuantity, 0);
  const usedQuantity = toNonNegativeInt(e.usedQuantity, 0);
  const scanCount = toNonNegativeInt(e.scanCount, 0);
  const suspectScanCount = toNonNegativeInt(e.suspectScanCount, 0);
  const failedScanCount = toNonNegativeInt(e.failedScanCount, 0);
  const maxGeneratableQuantity = requestedQuantity;

  return {
    template: {
      templateId: e.templateId ?? null,
      templateCode: e.templateCode ?? null,
      templateVersion: e.templateVersion ?? null,
      templateLifecycleStatus: e.templateLifecycleStatus ?? 'ACTIVE',
      resolvedBy: e.templateResolvedBy ?? 'PRODUCT_OR_CATEGORY',
      format: {
        qrEnabled: e.templateQrEnabled ?? true,
        serialPattern: e.templateSerialPattern ?? null,
      },
      securityFeatures:
        Array.isArray(e.templateSecurityFeatures) && e.templateSecurityFeatures.length > 0
          ? e.templateSecurityFeatures
          : ['UNIQUE_IDENTIFIER', 'ANTI_DUPLICATION_GUARD'],
      labelStructure: e.templateLabelStructure ?? null,
    },
    requestControl: {
      status: e.status,
      requestedQuantity,
      maxGeneratableQuantity,
      generatedQuantity,
      remainingGeneratableQuantity: Math.max(0, maxGeneratableQuantity - generatedQuantity),
      approvalRequired: true,
      generationAllowed: e.status === 'APPROVED' || e.status === 'FULFILLED',
      approvalWorkflow: {
        submittedAt: e.submittedAt ?? null,
        reviewDueAt: e.reviewDueAt ?? null,
        reviewedAt: e.reviewedAt ?? null,
        reviewedByUserId: e.reviewedByUserId ?? null,
        approvedAt: e.approvedAt ?? null,
        rejectionReason: e.rejectionReason ?? null,
      },
      complianceChecks: {
        forecastValidated: e.forecastValidated ?? null,
        capacityValidated: e.capacityValidated ?? null,
        historyValidated: e.historyValidated ?? null,
      },
    },
    generation: {
      generationUnitId: e.generationUnitId ?? null,
      generationBatchNumber: e.generationBatchNumber ?? null,
      status: e.generationStatus ?? (generatedQuantity > 0 ? 'GENERATED' : 'NOT_STARTED'),
      generatedQuantity,
      exactQuantityEnforced: true,
      overGenerationBlocked: generatedQuantity >= maxGeneratableQuantity,
      noReuseEnforced: true,
      traceabilityToken: e.generationTraceabilityToken ?? null,
    },
    printing: {
      printJobId: e.printJobId ?? null,
      printJobStatus:
        e.printJobStatus ??
        (printedQuantity > 0 ? 'EXECUTED_LOCKED' : generatedQuantity > 0 ? 'ASSIGNMENT_PENDING' : 'NOT_READY'),
      assignedPrinterUserId: e.assignedPrinterUserId ?? null,
      securePrinterId: e.securePrinterId ?? null,
      printedQuantity,
      oneTimePrintOnly: true,
      printLocked: e.printLocked ?? printedQuantity > 0,
      duplicationPrevented: true,
      unauthorizedAccessBlocked: true,
    },
    verification: {
      verificationStatus: e.verificationStatus ?? (scanCount > 0 ? 'ACTIVE_MONITORING' : 'PENDING'),
      scanCount,
      suspectScanCount,
      failedScanCount,
      lastVerifiedAt: e.lastVerifiedAt ?? null,
      antiFraudSignals: {
        duplicateDetected: e.duplicateDetected ?? false,
        geoAnomalyDetected: e.geoAnomalyDetected ?? false,
        velocityAnomalyDetected: e.velocityAnomalyDetected ?? false,
      },
    },
    distributionAndUsage: {
      distributedQuantity,
      usedQuantity,
      usageStatus: e.usageStatus ?? (usedQuantity > 0 ? 'IN_USE' : 'PENDING'),
    },
    audit: {
      auditTrailRequired: true,
      requestedByUserId: e.createdBy ?? null,
      submittedAt: e.submittedAt ?? null,
      generatedAt: e.generatedAt ?? null,
      printedAt: e.printedAt ?? null,
      updatedAt: e.updatedAt ?? null,
    },
    workflow: {
      currentStage: mapWorkflowStage(e.status, generatedQuantity, printedQuantity, scanCount),
      sequence: [
        'TEMPLATE',
        'REQUEST',
        'APPROVAL',
        'GENERATION',
        'PRINT_ASSIGNMENT',
        'PRINT_EXECUTION',
        'DISTRIBUTION',
        'USAGE',
        'VERIFICATION',
      ],
      controlCheckpoints: [
        'Template must be active and version-resolved',
        'Request cannot generate stamps before authority approval',
        'Generated quantity cannot exceed approved request quantity',
        'Print jobs are assigned to authorized users and executed once',
        'Each scan increments traceability and fraud analytics counters',
      ],
    },
  };
}

export class StampRequestResponse {
  static toResponse(row) {
    if (!row) return row;
    const e = row.get ? row.get({ plain: true }) : row;
    const response = {};
    BaseResponse.extendResponse(e, response);
    response.requestNumber = e.requestNumber;
    response.facilityId = e.facilityId;
    response.goodsCategory = e.goodsCategory;
    response.goodsDescription = e.goodsDescription;
    response.quantity = e.quantity;
    response.generatedQuantity =
      e.generatedQuantity !== undefined && e.generatedQuantity !== null
        ? e.generatedQuantity
        : 0;
    response.stampFeeAmount = e.stampFeeAmount;
    response.stampFeeCurrency = e.stampFeeCurrency;
    response.paymentStatus = e.paymentStatus;
    response.paymentReference = e.paymentReference;
    response.paymentProofUrl = e.paymentProofUrl;
    response.paidAt = e.paidAt;
    response.requiredByDate = e.requiredByDate;
    response.plannedProductionOrImportDate = e.plannedProductionOrImportDate;
    response.status = e.status;
    response.attachmentUrl = e.attachmentUrl;
    response.rejectionReason = e.rejectionReason;
    response.submittedAt = e.submittedAt;
    response.reviewDueAt = e.reviewDueAt;
    response.reviewedAt = e.reviewedAt;
    response.reviewedByUserId = e.reviewedByUserId;
    response.reviewSlaBreached = e.reviewSlaBreached;
    response.approvedAt = e.approvedAt;
    response.fulfilledAt = e.fulfilledAt;
    response.printedQuantity = toNonNegativeInt(
      e.printedQuantity !== undefined && e.printedQuantity !== null
        ? e.printedQuantity
        : e.generatedQuantity,
      0,
    );
    response.scanCount = toNonNegativeInt(e.scanCount, 0);
    response.suspectScanCount = toNonNegativeInt(e.suspectScanCount, 0);
    response.failedScanCount = toNonNegativeInt(e.failedScanCount, 0);
    response.integratedStampLifecycle = buildIntegratedLifecycle(e);
    if (e.facility) {
      response.facility = FacilityResponse.toBrief(e.facility);
    }
    return response;
  }

  /** Nested on stock events */
  static toRelatedBrief(row) {
    if (!row) return row;
    const e = row.get ? row.get({ plain: true }) : row;
    return {
      id: e.id,
      requestNumber: e.requestNumber,
      quantity: e.quantity,
      generatedQuantity:
        e.generatedQuantity !== undefined && e.generatedQuantity !== null
          ? e.generatedQuantity
          : 0,
      printedQuantity: toNonNegativeInt(
        e.printedQuantity !== undefined && e.printedQuantity !== null
          ? e.printedQuantity
          : e.generatedQuantity,
        0,
      ),
      scanCount: toNonNegativeInt(e.scanCount, 0),
      status: e.status,
    };
  }
}
