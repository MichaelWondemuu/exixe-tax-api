import { HttpError } from '../../../shared/utils/http-error.js';

export class OrgRegistrationPublicController {
  constructor({ orgRegistrationCommandService, orgRegistrationQueryService }) {
    this.orgRegistrationCommandService = orgRegistrationCommandService;
    this.orgRegistrationQueryService = orgRegistrationQueryService;
  }

  submitApplication = async (req, res) => {
    const row = await this.orgRegistrationCommandService.submitApplication(
      req,
      req.body || {},
    );
    res.status(201).json({ data: row });
  };

  getApplication = async (req, res) => {
    const { id } = req.params;
    if (!id) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'id is required');
    }
    const row = await this.orgRegistrationQueryService.getApplication(req, id);
    res.json({ data: row });
  };
}
