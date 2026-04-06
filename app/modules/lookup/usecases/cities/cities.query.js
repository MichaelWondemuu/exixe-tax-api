export class CitiesQueryService {
  /**
   * @param {{ citiesService: import('./cities.service.js').CitiesService }} deps
   */
  constructor({ citiesService }) {
    this.citiesService = citiesService;
  }

  getRegions = (req) => this.citiesService.getRegions(req);

  getZonesByRegionId = (req, regionId) =>
    this.citiesService.getZonesByRegionId(req, regionId);

  getWoredasByZoneId = (req, zoneId) =>
    this.citiesService.getWoredasByZoneId(req, zoneId);
}
