import { applyScopeFilters } from '../../../shared/repository/scope-filtering.js';

export class SuspiciousProductReportQueryService {
  constructor({ suspiciousProductReportRepository }) {
    this.suspiciousProductReportRepository = suspiciousProductReportRepository;
  }

  list = async (req, queryParams = {}) => {
    const limit = Math.min(
      Number(queryParams.limit ?? queryParams.page_size ?? 50) || 50,
      200,
    );
    const offset = Number(queryParams.offset ?? 0) || 0;
    const scoped = await applyScopeFilters(
      req,
      {
        order: [['created_at', 'DESC']],
      },
      this.suspiciousProductReportRepository.Model,
    );
    return this.suspiciousProductReportRepository.findAll(req, scoped, {
      ...queryParams,
      limit,
      offset,
    });
  };

  getById = async (req, id) =>
    this.suspiciousProductReportRepository.findById(req, id, {
      include: [
        { association: 'subjectOrganization', required: false },
        { association: 'facility', required: false },
        { association: 'product', required: false },
        { association: 'reportedBy', required: false, attributes: { exclude: ['pinHash'] } },
      ],
    });
}
