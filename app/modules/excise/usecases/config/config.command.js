export class ExciseConfigCommandService {
  constructor({ exciseCommandService }) {
    this.exciseCommandService = exciseCommandService;
  }

  create = (req, body) => this.exciseCommandService.createConfig(req, body);

  update = (req, key, body) => this.exciseCommandService.updateConfig(req, key, body);

  delete = (req, key) => this.exciseCommandService.deleteConfig(req, key);
}
