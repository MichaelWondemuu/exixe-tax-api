export class ExciseConfigQueryService {
  constructor({ exciseQueryService }) {
    this.exciseQueryService = exciseQueryService;
  }

  list = (req, query) => this.exciseQueryService.listConfigs(req, query);

  getByKey = (req, key) => this.exciseQueryService.getConfigByKey(req, key);
}
