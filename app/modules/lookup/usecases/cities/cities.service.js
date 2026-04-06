import { sequelize } from '../../../../shared/db/data-source.js';
import { HttpError } from '../../../../shared/utils/http-error.js';

export class CitiesService {
  /**
   * @param {{
   *   regionRepository: import('../../repository/region.repository.js').RegionRepository;
   *   zoneRepository: import('../../repository/zone.repository.js').ZoneRepository;
   *   woredaRepository: import('../../repository/woreda.repository.js').WoredaRepository;
   * }} deps
   */
  constructor({ regionRepository, zoneRepository, woredaRepository }) {
    this.regionRepository = regionRepository;
    this.zoneRepository = zoneRepository;
    this.woredaRepository = woredaRepository;
  }

  /**
   * Upload region, zone, and woreda JSON data and insert with relations.
   * Expects { regions: [], zones: [], woredas: [] } - ids in JSON are preserved for FK relations.
   */
  async uploadCitiesData(_req, payload) {
    const { regions = [], zones = [], woredas = [] } = payload;

    const regionList = Array.isArray(regions) ? regions : [];
    const zoneList = Array.isArray(zones) ? zones : [];
    const woredaList = Array.isArray(woredas) ? woredas : [];

    const t = await sequelize.transaction();
    try {
      await this.woredaRepository.destroyAllForce(t);
      await this.zoneRepository.destroyAllForce(t);
      await this.regionRepository.destroyAllForce(t);

      const regionRows = regionList.map((r) => ({
        id: r.id,
        code: r.code,
        description: r.description,
        region_type: r.region_type ?? null,
        description_amh: r.description_amh ?? null,
      }));
      const regionIdSet = new Set(regionRows.map((r) => r.id));

      const zoneRows = zoneList
        .filter((z) => regionIdSet.has(z.region_id))
        .map((z) => ({
          id: z.id,
          region_id: z.region_id,
          code: z.code,
          description: z.description,
          description_amh: z.description_amh ?? null,
        }));
      const zoneIdSet = new Set(zoneRows.map((z) => z.id));

      const woredaRows = woredaList
        .filter((w) => zoneIdSet.has(w.zone_id))
        .map((w) => ({
          id: w.id,
          zone_id: w.zone_id,
          code: w.code,
          description: w.description ?? null,
          description_amh: w.description_amh ?? null,
        }));

      await this.regionRepository.bulkCreate(regionRows, { transaction: t });
      await this.zoneRepository.bulkCreate(zoneRows, { transaction: t });
      await this.woredaRepository.bulkCreate(woredaRows, { transaction: t });

      await t.commit();

      return {
        regions: regionRows.length,
        zones: zoneRows.length,
        woredas: woredaRows.length,
      };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async getRegions(_req) {
    return this.regionRepository.findAllOrdered();
  }

  async getZonesByRegionId(_req, regionId) {
    return this.zoneRepository.findByRegionId(regionId);
  }

  async getWoredasByZoneId(_req, zoneId) {
    return this.woredaRepository.findByZoneId(zoneId);
  }

  async createRegion(_req, body) {
    let id = body.id;
    if (id == null) {
      const max = await this.regionRepository.maxId();
      id = (max ?? 0) + 1;
    }
    return this.regionRepository.getModel().create({
      id,
      code: body.code ?? null,
      description: body.description ?? null,
      region_type: body.region_type ?? null,
      description_amh: body.description_amh ?? null,
    });
  }

  async createZone(_req, body) {
    const regionId = body.region_id != null ? Number(body.region_id) : null;
    if (regionId == null || Number.isNaN(regionId)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'region_id is required');
    }
    const exists = await this.regionRepository.getModel().findByPk(regionId);
    if (!exists) {
      throw new HttpError(
        404,
        'NOT_FOUND',
        `Region with id ${regionId} not found`,
      );
    }
    let id = body.id;
    if (id == null) {
      const max = await this.zoneRepository.maxId();
      id = (max ?? 0) + 1;
    }
    return this.zoneRepository.getModel().create({
      id,
      region_id: regionId,
      code: body.code ?? null,
      description: body.description ?? '',
      description_amh: body.description_amh ?? null,
    });
  }

  async createWoreda(_req, body) {
    const zoneId = body.zone_id != null ? Number(body.zone_id) : null;
    if (zoneId == null || Number.isNaN(zoneId)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'zone_id is required');
    }
    const exists = await this.zoneRepository.getModel().findByPk(zoneId);
    if (!exists) {
      throw new HttpError(404, 'NOT_FOUND', `Zone with id ${zoneId} not found`);
    }
    let id = body.id;
    if (id == null) {
      const max = await this.woredaRepository.maxId();
      id = (max ?? 0) + 1;
    }
    return this.woredaRepository.getModel().create({
      id,
      zone_id: zoneId,
      code: body.code ?? null,
      description: body.description ?? null,
      description_amh: body.description_amh ?? null,
    });
  }
}
