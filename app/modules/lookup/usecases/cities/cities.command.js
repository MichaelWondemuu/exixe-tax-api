export class CitiesCommandService {
  /**
   * @param {{ citiesService: import('./cities.service.js').CitiesService }} deps
   */
  constructor({ citiesService }) {
    this.citiesService = citiesService;
  }

  uploadCitiesData = (req, payload) =>
    this.citiesService.uploadCitiesData(req, payload);

  createRegion = (req, body) => this.citiesService.createRegion(req, body);

  createZone = (req, body) => this.citiesService.createZone(req, body);

  createWoreda = (req, body) => this.citiesService.createWoreda(req, body);
}
