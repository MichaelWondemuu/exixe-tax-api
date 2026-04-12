import { applyScopeFilters } from '../../../shared/repository/scope-filtering.js';

export class CounterfeitReportQueryService {
  constructor({ counterfeitReportRepository }) {
    this.counterfeitReportRepository = counterfeitReportRepository;
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
      this.counterfeitReportRepository.Model,
    );
    return this.counterfeitReportRepository.findAll(req, scoped, {
      ...queryParams,
      limit,
      offset,
    });
  };

  getById = async (req, id) =>
    this.counterfeitReportRepository.findById(req, id, {
      include: [
        { association: 'subjectOrganization', required: false },
        { association: 'facility', required: false },
        { association: 'product', required: false },
      ],
    });
}
