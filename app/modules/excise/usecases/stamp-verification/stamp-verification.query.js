export class StampVerificationQueryService {
  constructor({ exciseQueryService }) {
    this.exciseQueryService = exciseQueryService;
  }

  list = (req, query) => this.exciseQueryService.listStampVerifications(req, query);

  getById = (req, id) => this.exciseQueryService.getStampVerificationById(req, id);

  getSummary = (req) => this.exciseQueryService.getStampVerificationSummary(req);
}

