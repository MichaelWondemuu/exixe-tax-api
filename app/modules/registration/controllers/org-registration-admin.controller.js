import { parseQueryParams } from '../../../shared/utils/query-parser.js';
import { formatPaginatedResponse } from '../../../shared/utils/pagination-formatter.js';
import { HttpError } from '../../../shared/utils/http-error.js';

export class OrgRegistrationAdminController {
  constructor({ orgRegistrationCommandService, orgRegistrationQueryService }) {
    this.orgRegistrationCommandService = orgRegistrationCommandService;
    this.orgRegistrationQueryService = orgRegistrationQueryService;
  }

  listApplications = async (req, res) => {
    const queryParams = parseQueryParams(req);
    const serviceResponse =
      await this.orgRegistrationQueryService.listApplications(req, queryParams);
    res.json(formatPaginatedResponse(serviceResponse, queryParams));
  };

  updateStatus = async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    if (!body.status) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'status is required');
    }
    const row = await this.orgRegistrationCommandService.updateApplicationStatus(
      req,
      id,
      { status: body.status, review_note: body.review_note },
    );
    res.json({ data: row });
  };
}
