export class StampRequestQueryService {
  constructor({ exciseQueryService }) {
    this.exciseQueryService = exciseQueryService;
  }

  list = (req, query) => this.exciseQueryService.listStampRequests(req, query);

  getById = (req, id) => this.exciseQueryService.getStampRequestById(req, id);

  listSlaBreaches = (req, query) =>
    this.exciseQueryService.listStampRequestSlaBreaches(req, query);
}

