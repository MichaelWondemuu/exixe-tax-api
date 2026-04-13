import { formatResponse } from '../../../shared/utils/response-formatter.js';

function trimOrNull(value) {
  if (value === undefined || value === null) return null;
  const cleaned = String(value).trim();
  return cleaned.length > 0 ? cleaned : null;
}

function extractStampIdentifier(rawValue) {
  const candidate = trimOrNull(rawValue);
  if (!candidate) return null;

  if (!/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  try {
    const parsed = new URL(candidate);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return candidate;

    const stampsIndex = parts.findIndex((part) => part.toLowerCase() === 'stamps');
    if (stampsIndex >= 0 && parts[stampsIndex + 1]) {
      return decodeURIComponent(parts[stampsIndex + 1]).trim();
    }

    return decodeURIComponent(parts[parts.length - 1]).trim();
  } catch (_error) {
    return candidate;
  }
}

function normalizePublicScanPayload(body = {}) {
  const qrUrl = trimOrNull(body.qrUrl);
  const stampIdentifier = extractStampIdentifier(body.stampIdentifier ?? qrUrl);
  return {
    ...body,
    qrUrl,
    stampIdentifier,
  };
}

export class StampVerificationController {
  constructor({ stampVerificationQueryService, stampVerificationCommandService }) {
    this.stampVerificationQueryService = stampVerificationQueryService;
    this.stampVerificationCommandService = stampVerificationCommandService;
  }

  list = async (req, res, next) => {
    try {
      const result = await this.stampVerificationQueryService.list(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const result = await this.stampVerificationQueryService.getById(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req, res, next) => {
    try {
      const result = await this.stampVerificationQueryService.getSummary(req);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getAllScans = async (req, res, next) => {
    try {
      const result = await this.stampVerificationQueryService.getAllScans(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createPublic = async (req, res, next) => {
    try {
      const normalizedBody = normalizePublicScanPayload(req.body || {});
      const result = await this.stampVerificationCommandService.createPublic(
        req,
        normalizedBody,
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  createOperator = async (req, res, next) => {
    try {
      const result = await this.stampVerificationCommandService.createOperator(
        req,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };
}

