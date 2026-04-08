export class StampStockEventCommandService {
  constructor({ exciseCommandService }) {
    this.exciseCommandService = exciseCommandService;
  }

  create = (req, body) => this.exciseCommandService.createStockEvent(req, body);

  submit = (req, id) => this.exciseCommandService.submitStockEvent(req, id);

  review = (req, id, body) => this.exciseCommandService.reviewStockEvent(req, id, body);

  complete = (req, id) => this.exciseCommandService.completeStockEvent(req, id);
}

