export class ForecastCommandService {
  constructor({ exciseCommandService }) {
    this.exciseCommandService = exciseCommandService;
  }

  create = (req, body) => this.exciseCommandService.createForecast(req, body);

  update = (req, id, body) => this.exciseCommandService.updateForecast(req, id, body);

  submit = (req, id) => this.exciseCommandService.submitForecast(req, id);
}

