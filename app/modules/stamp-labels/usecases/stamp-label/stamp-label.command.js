import { randomBytes, randomUUID } from 'crypto';
import { HttpError } from '../../../../shared/utils/http-error.js';
import {
  STAMP_LABEL_ENFORCEMENT_ACTION,
  STAMP_LABEL_EVENT_TYPE,
  STAMP_LABEL_LIFECYCLE_STATUS,
  STAMP_LABEL_VERIFICATION_RESULT,
} from '../../constants/stamp-labels.enums.js';
import { ensureStampLabelSchema } from './stamp-label.schema.js';

const STATUS_FLOW = [
  STAMP_LABEL_LIFECYCLE_STATUS.GENERATED,
  STAMP_LABEL_LIFECYCLE_STATUS.ISSUED,
  STAMP_LABEL_LIFECYCLE_STATUS.ASSIGNED,
  STAMP_LABEL_LIFECYCLE_STATUS.APPLIED,
  STAMP_LABEL_LIFECYCLE_STATUS.ACTIVATED,
  STAMP_LABEL_LIFECYCLE_STATUS.TRACKED,
  STAMP_LABEL_LIFECYCLE_STATUS.VERIFIED,
  STAMP_LABEL_LIFECYCLE_STATUS.AUDITED,
];

function statusRank(status) {
  const index = STATUS_FLOW.indexOf(status);
  return index >= 0 ? index : -1;
}

function buildStampUid(prefix = 'ET-EXS') {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const randomPart = randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${datePart}-${randomPart}`;
}

function extractActor(req) {
  return {
    actorId:
      req?.accountId ||
      req?.userId ||
      req?.user?.id ||
      req?.headers?.['x-user-id'] ||
      null,
    actorName:
      req?.user?.fullName ||
      req?.user?.name ||
      req?.headers?.['x-user-name'] ||
      null,
  };
}

function ensureLifecycle(currentStatus, allowedStatuses, actionName) {
  if (!allowedStatuses.includes(currentStatus)) {
    throw new HttpError(
      409,
      'STAMP_LIFECYCLE_CONFLICT',
      `Cannot ${actionName} stamp in ${currentStatus} status`,
    );
  }
}

export class StampLabelCommandService {
  /**
   * @param {{
   *  stampLabelRepository: import('../../repository/stamp-label.repository.js').StampLabelRepository;
   *  stampLabelEventRepository: import('../../repository/stamp-label.repository.js').StampLabelEventRepository;
   * }} deps
   */
  constructor({ stampLabelRepository, stampLabelEventRepository }) {
    this.stampLabelRepository = stampLabelRepository;
    this.stampLabelEventRepository = stampLabelEventRepository;
  }

  async logEvent(req, stamp, eventType, details = {}) {
    const actor = extractActor(req);
    const event = await this.stampLabelEventRepository.create(req, {
      id: randomUUID(),
      stampLabelId: stamp.id,
      stampUid: stamp.stampUid,
      eventType,
      fromStatus: details.fromStatus ?? null,
      toStatus: details.toStatus ?? stamp.status ?? null,
      actorType: details.actorType ?? null,
      actorId: details.actorId ?? actor.actorId,
      actorName: details.actorName ?? actor.actorName,
      locationCode: details.locationCode ?? null,
      verificationChannel: details.verificationChannel ?? null,
      verificationResult: details.verificationResult ?? null,
      payload: details.payload ?? {},
      occurredAt: details.occurredAt ?? new Date(),
    });
    return event;
  }

  async getStampOrFail(req, id) {
    const stamp = await this.stampLabelRepository.findByIdDetailed(req, id);
    if (!stamp) {
      throw new HttpError(404, 'NOT_FOUND', 'Stamp label not found');
    }
    return stamp;
  }

  async applyStatusUpdate(req, stamp, nextStatus, patch = {}) {
    const currentRank = statusRank(stamp.status);
    const nextRank = statusRank(nextStatus);
    const status = nextRank >= currentRank ? nextStatus : stamp.status;
    return this.stampLabelRepository.update(req, stamp.id, {
      ...patch,
      status,
    });
  }

  generate = async (req, body = {}) => {
    await ensureStampLabelSchema();
    const count = Number(body.count || 1);
    if (!Number.isFinite(count) || count < 1 || count > 5000) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'count must be between 1 and 5000',
      );
    }

    const now = new Date();
    const created = [];
    for (let i = 0; i < count; i += 1) {
      const stampUid = buildStampUid(body.uidPrefix);
      const stamp = await this.stampLabelRepository.create(req, {
        id: randomUUID(),
        stampUid,
        digitalLink:
          body.digitalLinkBase &&
          `${String(body.digitalLinkBase).replace(/\/$/, '')}/${stampUid}`,
        codeFormat: body.codeFormat,
        status: STAMP_LABEL_LIFECYCLE_STATUS.GENERATED,
        operatorType: body.operatorType,
        operatorName: body.operatorName,
        operatorTin: body.operatorTin,
        operatorLicenseNumber: body.operatorLicenseNumber || null,
        ethiopiaRevenueOffice: body.ethiopiaRevenueOffice || null,
        productId: body.productId || null,
        productName: body.productName || null,
        packageLevel: body.packageLevel,
        batchNumber: body.batchNumber || null,
        productionDate: body.productionDate || null,
        forecastReference: body.forecastReference || null,
        forecastSubmittedAt: body.forecastSubmittedAt || null,
        requiresSixtyDayForecast: body.requiresSixtyDayForecast ?? true,
        isImported: body.isImported ?? false,
        customsDeclarationNumber: body.customsDeclarationNumber || null,
        generatedAt: now,
        metadata: body.metadata || {},
      });

      await this.logEvent(req, stamp, STAMP_LABEL_EVENT_TYPE.GENERATED, {
        fromStatus: null,
        toStatus: STAMP_LABEL_LIFECYCLE_STATUS.GENERATED,
        payload: {
          generationBatchSize: count,
          ethiopianContext: {
            requiresSixtyDayForecast: stamp.requiresSixtyDayForecast,
            ethiopiaRevenueOffice: stamp.ethiopiaRevenueOffice,
          },
        },
        occurredAt: now,
      });
      created.push(stamp);
    }

    return {
      generatedCount: created.length,
      stamps: created,
    };
  };

  issue = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    ensureLifecycle(stamp.status, [STAMP_LABEL_LIFECYCLE_STATUS.GENERATED], 'issue');

    const issueTime = body.issuedAt ? new Date(body.issuedAt) : new Date();
    if (Number.isNaN(issueTime.getTime())) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'issuedAt is invalid');
    }

    if (stamp.requiresSixtyDayForecast && stamp.forecastSubmittedAt) {
      const forecastDate = new Date(stamp.forecastSubmittedAt);
      const leadMs = issueTime.getTime() - forecastDate.getTime();
      const minimumLeadMs = 60 * 24 * 60 * 60 * 1000;
      if (leadMs < minimumLeadMs) {
        throw new HttpError(
          409,
          'FORECAST_LEAD_TIME_NOT_MET',
          'Forecast reference must be submitted at least 60 days before issuance',
        );
      }
    }

    const updated = await this.applyStatusUpdate(
      req,
      stamp,
      STAMP_LABEL_LIFECYCLE_STATUS.ISSUED,
      {
        issuedAt: issueTime,
        notes: body.notes ?? stamp.notes,
      },
    );

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.ISSUED, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      payload: {
        forecastReference: updated.forecastReference,
        notes: body.notes || null,
      },
      occurredAt: issueTime,
    });

    return updated;
  };

  assign = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    ensureLifecycle(stamp.status, [STAMP_LABEL_LIFECYCLE_STATUS.ISSUED], 'assign');

    const assignedAt = body.assignedAt ? new Date(body.assignedAt) : new Date();
    const updated = await this.applyStatusUpdate(
      req,
      stamp,
      STAMP_LABEL_LIFECYCLE_STATUS.ASSIGNED,
      {
        assignedAt,
        assignedToOperatorId: body.assignedToOperatorId || null,
      },
    );

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.ASSIGNED, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      payload: {
        assignedToOperatorId: updated.assignedToOperatorId,
      },
      occurredAt: assignedAt,
    });

    return updated;
  };

  apply = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    ensureLifecycle(stamp.status, [STAMP_LABEL_LIFECYCLE_STATUS.ASSIGNED], 'apply');

    const appliedAt = body.appliedAt ? new Date(body.appliedAt) : new Date();
    const updated = await this.applyStatusUpdate(
      req,
      stamp,
      STAMP_LABEL_LIFECYCLE_STATUS.APPLIED,
      {
        appliedAt,
        applicationLineCode: body.applicationLineCode || null,
      },
    );

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.APPLIED, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      locationCode: body.locationCode || null,
      payload: {
        applicationLineCode: updated.applicationLineCode,
      },
      occurredAt: appliedAt,
    });

    return updated;
  };

  activate = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    ensureLifecycle(stamp.status, [STAMP_LABEL_LIFECYCLE_STATUS.APPLIED], 'activate');

    const activatedAt = body.activatedAt ? new Date(body.activatedAt) : new Date();
    const updated = await this.applyStatusUpdate(
      req,
      stamp,
      STAMP_LABEL_LIFECYCLE_STATUS.ACTIVATED,
      {
        activatedAt,
        activationLocationCode: body.activationLocationCode || null,
        lastKnownLocationCode:
          body.activationLocationCode || stamp.lastKnownLocationCode || null,
      },
    );

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.ACTIVATED, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      locationCode: updated.activationLocationCode,
      occurredAt: activatedAt,
    });

    return updated;
  };

  track = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    ensureLifecycle(
      stamp.status,
      [
        STAMP_LABEL_LIFECYCLE_STATUS.ACTIVATED,
        STAMP_LABEL_LIFECYCLE_STATUS.TRACKED,
        STAMP_LABEL_LIFECYCLE_STATUS.VERIFIED,
        STAMP_LABEL_LIFECYCLE_STATUS.AUDITED,
      ],
      'track',
    );

    const trackedAt = body.trackedAt ? new Date(body.trackedAt) : new Date();
    const updated = await this.applyStatusUpdate(
      req,
      stamp,
      STAMP_LABEL_LIFECYCLE_STATUS.TRACKED,
      {
        trackedAt,
        lastKnownLocationCode: body.locationCode || stamp.lastKnownLocationCode || null,
      },
    );

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.TRACKED, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      locationCode: body.locationCode || null,
      payload: {
        checkpoint: body.checkpoint || null,
        scanDeviceId: body.scanDeviceId || null,
      },
      occurredAt: trackedAt,
    });

    return updated;
  };

  verify = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    ensureLifecycle(
      stamp.status,
      [
        STAMP_LABEL_LIFECYCLE_STATUS.ACTIVATED,
        STAMP_LABEL_LIFECYCLE_STATUS.TRACKED,
        STAMP_LABEL_LIFECYCLE_STATUS.VERIFIED,
        STAMP_LABEL_LIFECYCLE_STATUS.AUDITED,
        STAMP_LABEL_LIFECYCLE_STATUS.REVOKED,
      ],
      'verify',
    );

    const verifiedAt = body.verifiedAt ? new Date(body.verifiedAt) : new Date();
    const verificationResult =
      stamp.status === STAMP_LABEL_LIFECYCLE_STATUS.REVOKED
        ? STAMP_LABEL_VERIFICATION_RESULT.CANCELLED_UI
        : body.result;

    const nextStatus =
      stamp.status === STAMP_LABEL_LIFECYCLE_STATUS.REVOKED
        ? STAMP_LABEL_LIFECYCLE_STATUS.REVOKED
        : STAMP_LABEL_LIFECYCLE_STATUS.VERIFIED;

    const updated = await this.applyStatusUpdate(req, stamp, nextStatus, {
      verifiedAt,
      lastVerificationResult: verificationResult,
      lastKnownLocationCode: body.locationCode || stamp.lastKnownLocationCode || null,
    });

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.VERIFIED, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      locationCode: body.locationCode || null,
      verificationChannel: body.channel || null,
      verificationResult,
      payload: {
        inspectorBadge: body.inspectorBadge || null,
        remarks: body.remarks || null,
      },
      occurredAt: verifiedAt,
    });

    return updated;
  };

  verifyByUid = async (req, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.stampLabelRepository.findByUid(req, body.stampUid);
    if (!stamp) {
      return {
        status: STAMP_LABEL_VERIFICATION_RESULT.NOT_FOUND,
        stampUid: body.stampUid,
      };
    }
    const verified = await this.verify(req, stamp.id, body);
    return {
      status: verified.lastVerificationResult,
      stamp: verified,
    };
  };

  audit = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    if (stamp.status === STAMP_LABEL_LIFECYCLE_STATUS.GENERATED) {
      throw new HttpError(
        409,
        'STAMP_LIFECYCLE_CONFLICT',
        'Generated stamps must be issued before audit',
      );
    }

    const auditedAt = body.auditedAt ? new Date(body.auditedAt) : new Date();
    const nextStatus =
      stamp.status === STAMP_LABEL_LIFECYCLE_STATUS.REVOKED
        ? STAMP_LABEL_LIFECYCLE_STATUS.REVOKED
        : STAMP_LABEL_LIFECYCLE_STATUS.AUDITED;

    const updated = await this.applyStatusUpdate(req, stamp, nextStatus, {
      auditedAt,
      notes: body.notes ?? stamp.notes,
    });

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.AUDITED, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      payload: {
        inspectionReference: body.inspectionReference || null,
        findings: body.findings || null,
      },
      occurredAt: auditedAt,
    });

    return updated;
  };

  enforce = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    const action = body.action;
    if (!Object.values(STAMP_LABEL_ENFORCEMENT_ACTION).includes(action)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid enforcement action');
    }

    const enforcementAt = body.enforcedAt ? new Date(body.enforcedAt) : new Date();
    const isRevoke = action === STAMP_LABEL_ENFORCEMENT_ACTION.REVOKE;
    const updated = await this.stampLabelRepository.update(req, stamp.id, {
      enforcementState: action,
      revokedAt: isRevoke ? enforcementAt : stamp.revokedAt,
      status: isRevoke ? STAMP_LABEL_LIFECYCLE_STATUS.REVOKED : stamp.status,
      notes: body.notes ?? stamp.notes,
    });

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.ENFORCEMENT, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      payload: {
        action,
        caseNumber: body.caseNumber || null,
        notes: body.notes || null,
      },
      occurredAt: enforcementAt,
    });

    return updated;
  };
}
