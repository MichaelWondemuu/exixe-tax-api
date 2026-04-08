export class StampStockEventQueryService {
  constructor({ exciseQueryService }) {
    this.exciseQueryService = exciseQueryService;
  }

  list = (req, query) => this.exciseQueryService.listStockEvents(req, query);

  getById = (req, id) => this.exciseQueryService.getStockEventById(req, id);
}

