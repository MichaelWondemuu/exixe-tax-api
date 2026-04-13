import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class ProductionRecordRepository extends BaseRepository {
  constructor({ Model }) {
    super({ Model });
  }
}
