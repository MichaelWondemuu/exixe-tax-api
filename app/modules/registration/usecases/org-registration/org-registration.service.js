import { HttpError } from '../../../../shared/utils/http-error.js';
import { ensureDefaultBusinessTypes } from '../../../lookup/repository/business-type.repository.js';

const STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

export class OrgRegistrationService {
  /**
   * @param {{
   *   applicationRepository: import('../../repository/org-registration-application.repository.js').OrgRegistrationApplicationRepository;
   *   businessTypeRepository: import('../../../lookup/repository/business-type.repository.js').BusinessTypeRepository;
   * }} deps
   */
  constructor({ applicationRepository, businessTypeRepository }) {
    this.applicationRepository = applicationRepository;
    this.businessTypeRepository = businessTypeRepository;
  }

  async submitApplication(_req, body) {
    await ensureDefaultBusinessTypes();
    const legalName = body.legal_name ?? body.legalName;
    if (!legalName || String(legalName).trim() === '') {
      throw new HttpError(400, 'VALIDATION_ERROR', 'legal_name is required');
    }

    let businessTypeId = body.business_type_id ?? body.businessTypeId ?? null;
    if (businessTypeId) {
      const bt = await this.businessTypeRepository.findByIdRaw(businessTypeId);
      if (!bt) {
        throw new HttpError(404, 'NOT_FOUND', 'Business type not found');
      }
    }

    return this.applicationRepository.getModel().create({
      legalName: String(legalName).trim(),
      businessTypeId,
      contactEmail: body.contact_email ?? body.contactEmail ?? null,
      contactPhone: body.contact_phone ?? body.contactPhone ?? null,
      details:
        body.details && typeof body.details === 'object' ? body.details : null,
      status: 'PENDING',
    });
  }

  async getApplication(_req, id) {
    const row = await this.applicationRepository.getModel().findByPk(id, {
      include: [
        {
          association: 'businessType',
          attributes: ['id', 'code', 'name'],
        },
      ],
    });
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Application not found');
    }
    return row;
  }

  async updateStatus(_req, id, { status, review_note: reviewNote }) {
    if (!STATUSES.includes(status)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid status');
    }
    const row = await this.applicationRepository.getModel().findByPk(id);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Application not found');
    }
    await row.update({
      status,
      reviewNote: reviewNote ?? null,
    });
    return row.reload({
      include: [
        {
          association: 'businessType',
          attributes: ['id', 'code', 'name'],
        },
      ],
    });
  }
}
