import { HttpError } from '../../../shared/utils/http-error.js';

export class SectorController {
  constructor({ sectorQueryService, sectorCommandService }) {
    this.sectorQueryService = sectorQueryService;
    this.sectorCommandService = sectorCommandService;
  }

  upload = async (req, res, next) => {
    try {
      const payload = req.body?.payload ?? req.body;
      if (
        !payload ||
        (typeof payload !== 'object' && !Array.isArray(payload))
      ) {
        throw new HttpError(
          400,
          'INVALID_PAYLOAD',
          'Expected JSON array of sectors or { sectors: [...] }',
        );
      }
      const result = await this.sectorCommandService.uploadSectors(
        req,
        payload,
      );
      res.status(200).json({
        message: 'Sectors uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getTree = async (req, res, next) => {
    try {
      const tree = await this.sectorQueryService.getTree(req);
      res.json({ data: tree });
    } catch (error) {
      next(error);
    }
  };

  list = async (req, res, next) => {
    try {
      const queryParams = req.query || {};
      const list = await this.sectorQueryService.list(req, queryParams);
      res.json({ data: list });
    } catch (error) {
      next(error);
    }
  };

  getChildren = async (req, res, next) => {
    try {
      const sectorId = req.params.sectorId;
      const list = await this.sectorQueryService.getChildren(req, sectorId);
      res.json({ data: list });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const sector = await this.sectorQueryService.getById(req, req.params.id);
      if (!sector) {
        throw new HttpError(404, 'SECTOR_NOT_FOUND', 'Sector not found');
      }
      res.json({ data: sector });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const row = await this.sectorCommandService.create(req, req.body || {});
      res.status(201).json({ data: row });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const row = await this.sectorCommandService.update(
        req,
        req.params.id,
        req.body || {},
      );
      res.json({ data: row });
    } catch (error) {
      next(error);
    }
  };
}
