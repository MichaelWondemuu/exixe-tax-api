import { HttpError } from '../../../../shared/utils/http-error.js';
import { sequelize } from '../../../../shared/db/data-source.js';

/**
 * Build recursive tree from flat list of sectors (by parentId).
 */
function pickSectorNode(s) {
  const out = {
    id: s.id,
    parentId: s.parentId,
    name: s.name,
    code: s.code,
    division: s.division,
    majorGroup: s.majorGroup,
    group: s.group,
    licensingCategory: s.licensingCategory,
    verificationBodyId: s.verificationBodyId,
    licensingAuthorityId: s.licensingAuthorityId,
    expectedDailyTxnMin: s.expectedDailyTxnMin,
    expectedDailyTxnMax: s.expectedDailyTxnMax,
    expectedAvgTicketMin: s.expectedAvgTicketMin,
    expectedAvgTicketMax: s.expectedAvgTicketMax,
    expectedOpenTime: s.expectedOpenTime,
    expectedCloseTime: s.expectedCloseTime,
    riskThresholdPercent: s.riskThresholdPercent,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
  out.verificationBodyName = s.verificationBody?.name ?? null;
  out.licensingAuthorityName = s.licensingAuthority?.name ?? null;
  return out;
}

function buildTree(flat, parentId = null) {
  return flat
    .filter(
      (s) =>
        s.parentId === parentId ||
        (parentId == null && s.parentId == null),
    )
    .map((s) => ({
      ...pickSectorNode(s),
      children: buildTree(flat, s.id),
    }));
}

function sortSectorsParentFirst(items) {
  const idSet = new Set(items.map((i) => i.id));
  const valid = items.filter((i) => {
    if (!i.id || !i.name) return false;
    if (
      i.parentId != null &&
      i.parentId !== '' &&
      !idSet.has(i.parentId)
    ) {
      return false;
    }
    return true;
  });
  const ordered = [];
  const added = new Set();
  let remaining = valid.filter((i) => !added.has(i.id));
  while (remaining.length > 0) {
    const next = remaining.filter(
      (i) =>
        i.parentId == null ||
        i.parentId === '' ||
        added.has(i.parentId),
    );
    if (next.length === 0) {
      break;
    }
    next.forEach((i) => {
      ordered.push(i);
      added.add(i.id);
    });
    remaining = valid.filter((i) => !added.has(i.id));
  }
  return ordered;
}

function strTrim(v) {
  return v != null && String(v).trim() !== '' ? String(v).trim() : null;
}

function toFlatSector(s) {
  const j = s && typeof s.toJSON === 'function' ? s.toJSON() : { ...s };
  j.verificationBodyName = j.verificationBody?.name ?? null;
  j.licensingAuthorityName = j.licensingAuthority?.name ?? null;
  delete j.verificationBody;
  delete j.licensingAuthority;
  if (j.parent) j.parent = toFlatSector(j.parent);
  if (Array.isArray(j.children)) j.children = j.children.map(toFlatSector);
  return j;
}

function mapSectorRow(item, verificationBodyIdMap, licensingAuthorityIdMap) {
  const vbName = strTrim(item.verificationBody);
  const laName = strTrim(item.licensingAuthority);
  return {
    id: item.id,
    parentId:
      item.parentId == null || item.parentId === '' ? null : item.parentId,
    name: String(item.name).trim(),
    code: strTrim(item.code),
    division: strTrim(item.division),
    majorGroup: strTrim(item.majorGroup),
    group: strTrim(item.group),
    licensingCategory: strTrim(item.licensingCategory),
    verificationBodyId: vbName
      ? verificationBodyIdMap.get(vbName) ?? null
      : null,
    licensingAuthorityId: laName
      ? licensingAuthorityIdMap.get(laName) ?? null
      : null,
    expectedDailyTxnMin:
      item.expectedDailyTxnMin != null
        ? Number(item.expectedDailyTxnMin)
        : null,
    expectedDailyTxnMax:
      item.expectedDailyTxnMax != null
        ? Number(item.expectedDailyTxnMax)
        : null,
    expectedAvgTicketMin:
      item.expectedAvgTicketMin != null
        ? Number(item.expectedAvgTicketMin)
        : null,
    expectedAvgTicketMax:
      item.expectedAvgTicketMax != null
        ? Number(item.expectedAvgTicketMax)
        : null,
    expectedOpenTime: strTrim(item.expectedOpenTime),
    expectedCloseTime: strTrim(item.expectedCloseTime),
    riskThresholdPercent:
      item.riskThresholdPercent != null
        ? Number(item.riskThresholdPercent)
        : null,
  };
}

export class SectorService {
  /**
   * @param {{
   *   sectorRepository: import('../../repository/sector.repository.js').SectorRepository;
   *   verificationBodyRepository: import('../../repository/verification-body.repository.js').VerificationBodyRepository;
   *   licensingAuthorityRepository: import('../../repository/licensing-authority.repository.js').LicensingAuthorityRepository;
   * }} deps
   */
  constructor({
    sectorRepository,
    verificationBodyRepository,
    licensingAuthorityRepository,
  }) {
    this.sectorRepository = sectorRepository;
    this.verificationBodyRepository = verificationBodyRepository;
    this.licensingAuthorityRepository = licensingAuthorityRepository;
  }

  async ensureVerificationBodiesAndAuthorities(raw, transaction) {
    const vbNames = new Set();
    const laNames = new Set();
    raw.forEach((item) => {
      const vb =
        item.verificationBody != null &&
        String(item.verificationBody).trim() !== ''
          ? String(item.verificationBody).trim()
          : null;
      const la =
        item.licensingAuthority != null &&
        String(item.licensingAuthority).trim() !== ''
          ? String(item.licensingAuthority).trim()
          : null;
      if (vb) vbNames.add(vb);
      if (la) laNames.add(la);
    });
    const verificationBodyIdMap = new Map();
    const licensingAuthorityIdMap = new Map();
    for (const name of vbNames) {
      const row = await this.verificationBodyRepository.findOrCreateByName(
        name,
        transaction,
      );
      verificationBodyIdMap.set(name, row.id);
    }
    for (const name of laNames) {
      const row = await this.licensingAuthorityRepository.findOrCreateByName(
        name,
        transaction,
      );
      licensingAuthorityIdMap.set(name, row.id);
    }
    return { verificationBodyIdMap, licensingAuthorityIdMap };
  }

  async uploadSectors(_req, payload) {
    const raw = Array.isArray(payload) ? payload : payload?.sectors;
    if (!Array.isArray(raw)) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Payload must be an array of sectors or { sectors: [...] }',
      );
    }
    const ordered = raw.length === 0 ? [] : sortSectorsParentFirst(raw);
    const t = await sequelize.transaction();
    try {
      const { verificationBodyIdMap, licensingAuthorityIdMap } =
        await this.ensureVerificationBodiesAndAuthorities(raw, t);
      const rows = ordered.map((item) =>
        mapSectorRow(item, verificationBodyIdMap, licensingAuthorityIdMap),
      );
      await this.sectorRepository.destroyAll(t);
      await this.sectorRepository.bulkCreate(rows, { transaction: t });
      await t.commit();
      return { count: rows.length };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async getTree(_req) {
    const list = await this.sectorRepository.findAllForTree();
    const flat = list.map((r) => r.toJSON());
    return buildTree(flat, null);
  }

  async list(_req, queryParams = {}) {
    const where = {};
    if (Object.prototype.hasOwnProperty.call(queryParams, 'parentId')) {
      where.parentId =
        queryParams.parentId === 'null' || queryParams.parentId === null
          ? null
          : queryParams.parentId;
    }
    const rows = await this.sectorRepository.findAllByParentFilter(where);
    return rows.map(toFlatSector);
  }

  async getChildren(_req, sectorId) {
    const parentId =
      sectorId === 'null' || sectorId === 'root' ? null : sectorId;
    const rows =
      await this.sectorRepository.findChildrenByParentId(parentId);
    return rows.map(toFlatSector);
  }

  async create(_req, body) {
    const name = body?.name?.trim();
    if (!name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }
    const parentId =
      body?.parentId == null || body?.parentId === '' ? null : body.parentId;
    if (parentId) {
      const parent = await this.sectorRepository
        .getModel()
        .findByPk(parentId);
      if (!parent) {
        throw new HttpError(
          404,
          'NOT_FOUND',
          `Parent sector with id ${parentId} not found`,
        );
      }
    }
    const vbId =
      body?.verificationBodyId == null || body?.verificationBodyId === ''
        ? null
        : body.verificationBodyId;
    const laId =
      body?.licensingAuthorityId == null || body?.licensingAuthorityId === ''
        ? null
        : body.licensingAuthorityId;
    return this.sectorRepository.getModel().create({
      name,
      code: body?.code?.trim() || null,
      parentId,
      division: strTrim(body?.division),
      majorGroup: strTrim(body?.majorGroup),
      group: strTrim(body?.group),
      licensingCategory: strTrim(body?.licensingCategory),
      verificationBodyId: vbId,
      licensingAuthorityId: laId,
      expectedDailyTxnMin:
        body?.expectedDailyTxnMin != null
          ? Number(body.expectedDailyTxnMin)
          : undefined,
      expectedDailyTxnMax:
        body?.expectedDailyTxnMax != null
          ? Number(body.expectedDailyTxnMax)
          : undefined,
      expectedAvgTicketMin:
        body?.expectedAvgTicketMin != null
          ? Number(body.expectedAvgTicketMin)
          : undefined,
      expectedAvgTicketMax:
        body?.expectedAvgTicketMax != null
          ? Number(body.expectedAvgTicketMax)
          : undefined,
      expectedOpenTime:
        body?.expectedOpenTime != null
          ? String(body.expectedOpenTime).trim()
          : undefined,
      expectedCloseTime:
        body?.expectedCloseTime != null
          ? String(body.expectedCloseTime).trim()
          : undefined,
      riskThresholdPercent:
        body?.riskThresholdPercent != null
          ? Number(body.riskThresholdPercent)
          : undefined,
    });
  }

  async update(_req, id, body) {
    const sector = await this.sectorRepository.getModel().findByPk(id);
    if (!sector) {
      throw new HttpError(404, 'NOT_FOUND', `Sector with id ${id} not found`);
    }
    if (body?.parentId !== undefined) {
      const parentId =
        body.parentId == null || body.parentId === '' ? null : body.parentId;
      if (parentId === id) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'Sector cannot be its own parent',
        );
      }
      if (parentId) {
        const parent = await this.sectorRepository
          .getModel()
          .findByPk(parentId);
        if (!parent) {
          throw new HttpError(
            404,
            'NOT_FOUND',
            `Parent sector with id ${parentId} not found`,
          );
        }
      }
      sector.parentId = parentId;
    }
    if (body?.name !== undefined) {
      const n = body.name?.trim();
      if (!n) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'name cannot be empty');
      }
      sector.name = n;
    }
    if (body?.code !== undefined) {
      sector.code = body.code?.trim() || null;
    }
    if (body?.division !== undefined) sector.division = strTrim(body.division);
    if (body?.majorGroup !== undefined) {
      sector.majorGroup = strTrim(body.majorGroup);
    }
    if (body?.group !== undefined) sector.group = strTrim(body.group);
    if (body?.licensingCategory !== undefined) {
      sector.licensingCategory = strTrim(body.licensingCategory);
    }
    if (body?.verificationBodyId !== undefined) {
      sector.verificationBodyId =
        body.verificationBodyId == null || body.verificationBodyId === ''
          ? null
          : body.verificationBodyId;
    }
    if (body?.licensingAuthorityId !== undefined) {
      sector.licensingAuthorityId =
        body.licensingAuthorityId == null || body.licensingAuthorityId === ''
          ? null
          : body.licensingAuthorityId;
    }
    if (body?.expectedDailyTxnMin !== undefined) {
      sector.expectedDailyTxnMin =
        body.expectedDailyTxnMin == null
          ? null
          : Number(body.expectedDailyTxnMin);
    }
    if (body?.expectedDailyTxnMax !== undefined) {
      sector.expectedDailyTxnMax =
        body.expectedDailyTxnMax == null
          ? null
          : Number(body.expectedDailyTxnMax);
    }
    if (body?.expectedAvgTicketMin !== undefined) {
      sector.expectedAvgTicketMin =
        body.expectedAvgTicketMin == null
          ? null
          : Number(body.expectedAvgTicketMin);
    }
    if (body?.expectedAvgTicketMax !== undefined) {
      sector.expectedAvgTicketMax =
        body.expectedAvgTicketMax == null
          ? null
          : Number(body.expectedAvgTicketMax);
    }
    if (body?.expectedOpenTime !== undefined) {
      sector.expectedOpenTime =
        body.expectedOpenTime == null
          ? null
          : String(body.expectedOpenTime).trim();
    }
    if (body?.expectedCloseTime !== undefined) {
      sector.expectedCloseTime =
        body.expectedCloseTime == null
          ? null
          : String(body.expectedCloseTime).trim();
    }
    if (body?.riskThresholdPercent !== undefined) {
      sector.riskThresholdPercent =
        body.riskThresholdPercent == null
          ? null
          : Number(body.riskThresholdPercent);
    }
    await sector.save();
    return sector;
  }

  async getById(_req, id) {
    const sector = await this.sectorRepository.findByPkWithGraph(id);
    return sector ? toFlatSector(sector) : null;
  }
}
