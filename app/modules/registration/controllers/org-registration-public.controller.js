import { HttpError } from '../../../shared/utils/http-error.js';

export class OrgRegistrationPublicController {
  constructor({ orgRegistrationCommandService, orgRegistrationQueryService }) {
    this.orgRegistrationCommandService = orgRegistrationCommandService;
    this.orgRegistrationQueryService = orgRegistrationQueryService;
  }

  submitApplication = async (req, res) => {
    const result = await this.orgRegistrationCommandService.submitApplication(
      req,
      req.body || {},
    );
    const application = result.application ?? result;
    const warnings = result.warnings ?? [];
    const referenceCode = application?.reference ?? null;
    const trackingNumber = referenceCode ?? application?.id ?? null;
    const statusUrl = trackingNumber
      ? `/v1/registrations/applications/status/${encodeURIComponent(trackingNumber)}`
      : null;

    res.status(201).json({
      data: application,
      warnings,
      trackingNumber,
      referenceCode,
      statusUrl,
    });
  };

  getApplication = async (req, res) => {
    const { id } = req.params;
    if (!id) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'id is required');
    }
    const row = await this.orgRegistrationQueryService.getApplication(req, id);
    res.json({ data: row });
  };

  getApplicationByReference = async (req, res) => {
    const { reference } = req.params;
    const row =
      await this.orgRegistrationQueryService.getApplicationByReference(
        req,
        reference,
      );
    res.json({ data: row });
  };

  /** GET /applications/status/:code — tracking link (reference or UUID). */
  getApplicationByTrackingCode = async (req, res) => {
    const { code } = req.params;
    const row =
      await this.orgRegistrationQueryService.getApplicationByTrackingCode(
        req,
        code,
      );
    res.json({ data: row });
  };
}
