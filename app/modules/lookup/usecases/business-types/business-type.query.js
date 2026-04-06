import { ensureDefaultBusinessTypes } from '../../repository/business-type.repository.js';

export class BusinessTypeQueryService {
  /**
   * @param {{ businessTypeRepository: import('../../repository/business-type.repository.js').BusinessTypeRepository }} deps
   */
  constructor({ businessTypeRepository }) {
    this.businessTypeRepository = businessTypeRepository;
  }

  listBusinessTypes = async () => {
    await ensureDefaultBusinessTypes();
    const rows = await this.businessTypeRepository.findAllOrdered();
    return { data: rows };
  };
}
