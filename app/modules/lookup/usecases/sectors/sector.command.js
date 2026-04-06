export class SectorCommandService {
  /**
   * @param {{ sectorService: import('./sector.service.js').SectorService }} deps
   */
  constructor({ sectorService }) {
    this.sectorService = sectorService;
  }

  uploadSectors = (req, payload) =>
    this.sectorService.uploadSectors(req, payload);

  create = (req, body) => this.sectorService.create(req, body);

  update = (req, id, body) => this.sectorService.update(req, id, body);
}
