import { Op } from 'sequelize';
import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class PublicPortalAnnouncementRepository extends BaseRepository {
  constructor() {
    super({ Model: models.PublicPortalAnnouncement });
  }

  findActive(req, { category = '', priority = '' } = {}) {
    const where = { isActive: true };
    if (category) where.category = String(category).toUpperCase();
    if (priority) where.priority = String(priority).toUpperCase();
    return this.findMany(req, where, {
      order: [['publishedAt', 'DESC']],
      limit: 200,
    });
  }
}

export class PublicPortalReportRepository extends BaseRepository {
  constructor() {
    super({ Model: models.PublicPortalReport });
  }

  findByReference(req, reference) {
    return this.findOne(req, { reference: String(reference || '').trim() });
  }

  findManyByStatus(req, status = '') {
    const where = {};
    if (status) where.status = String(status).toUpperCase();
    return this.findMany(req, where, {
      order: [['updatedAt', 'DESC']],
      limit: 500,
    });
  }
}

export class PublicPortalNotificationRepository extends BaseRepository {
  constructor() {
    super({ Model: models.PublicPortalNotification });
  }

  findByReporterId(req, reporterId) {
    return this.findMany(
      req,
      { reporterId: String(reporterId || '').trim() },
      {
        order: [['createdAt', 'DESC']],
        limit: 100,
      },
    );
  }

  findBroadcast(req) {
    return this.findMany(
      req,
      {
        reporterId: {
          [Op.is]: null,
        },
      },
      {
        order: [['createdAt', 'DESC']],
        limit: 100,
      },
    );
  }
}
