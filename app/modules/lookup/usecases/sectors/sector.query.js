export class SectorQueryService {
  /**
   * @param {{ sectorService: import('./sector.service.js').SectorService }} deps
   */
  constructor({ sectorService }) {
    this.sectorService = sectorService;
  }

  getTree = (req) => this.sectorService.getTree(req);

  list = (req, queryParams) => this.sectorService.list(req, queryParams);

  getChildren = (req, sectorId) =>
    this.sectorService.getChildren(req, sectorId);

  getById = (req, id) => this.sectorService.getById(req, id);
}
