import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class ExciseConfigRepository extends BaseRepository {
  constructor() {
    super({ Model: models.ExciseConfig });
  }
}
