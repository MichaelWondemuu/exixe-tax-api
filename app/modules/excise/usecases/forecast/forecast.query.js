export class ForecastQueryService {
  constructor({ exciseQueryService }) {
    this.exciseQueryService = exciseQueryService;
  }

  list = (req, query) => this.exciseQueryService.listForecasts(req, query);

  getById = (req, id) => this.exciseQueryService.getForecastById(req, id);
}

