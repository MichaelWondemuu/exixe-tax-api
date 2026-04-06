import { HttpError } from '../../../shared/utils/http-error.js';

export class CitiesController {
  constructor({ citiesQueryService, citiesCommandService }) {
    this.citiesQueryService = citiesQueryService;
    this.citiesCommandService = citiesCommandService;
  }

  upload = async (req, res, next) => {
    try {
      const payload = req.body?.payload ?? req.body;
      if (!payload || typeof payload !== 'object') {
        throw new HttpError(
          400,
          'INVALID_PAYLOAD',
          'Expected JSON body { regions, zones, woredas } or multipart files: region, zone, woreda (each a JSON array).',
        );
      }
      const result = await this.citiesCommandService.uploadCitiesData(
        req,
        payload,
      );
      res.status(200).json({
        message: 'Cities data uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getRegions = async (req, res, next) => {
    try {
      const list = await this.citiesQueryService.getRegions(req);
      res.json({ data: list });
    } catch (error) {
      next(error);
    }
  };

  getZonesByRegionId = async (req, res, next) => {
    try {
      const regionId = parseInt(req.params.regionId, 10);
      if (Number.isNaN(regionId)) {
        throw new HttpError(
          400,
          'INVALID_REGION_ID',
          'regionId must be a number',
        );
      }
      const list = await this.citiesQueryService.getZonesByRegionId(
        req,
        regionId,
      );
      res.json({ data: list });
    } catch (error) {
      next(error);
    }
  };

  getWoredasByZoneId = async (req, res, next) => {
    try {
      const zoneId = parseInt(req.params.zoneId, 10);
      if (Number.isNaN(zoneId)) {
        throw new HttpError(400, 'INVALID_ZONE_ID', 'zoneId must be a number');
      }
      const list = await this.citiesQueryService.getWoredasByZoneId(
        req,
        zoneId,
      );
      res.json({ data: list });
    } catch (error) {
      next(error);
    }
  };

  createRegion = async (req, res, next) => {
    try {
      const body = req.body || {};
      const row = await this.citiesCommandService.createRegion(req, body);
      res.status(201).json({ data: row });
    } catch (error) {
      next(error);
    }
  };

  createZone = async (req, res, next) => {
    try {
      const body = req.body || {};
      const row = await this.citiesCommandService.createZone(req, body);
      res.status(201).json({ data: row });
    } catch (error) {
      next(error);
    }
  };

  createWoreda = async (req, res, next) => {
    try {
      const body = req.body || {};
      const row = await this.citiesCommandService.createWoreda(req, body);
      res.status(201).json({ data: row });
    } catch (error) {
      next(error);
    }
  };
}
