export class StampRequestCommandService {
  constructor({ exciseCommandService }) {
    this.exciseCommandService = exciseCommandService;
  }

  create = (req, body) => this.exciseCommandService.createStampRequest(req, body);

  updatePayment = (req, id, body) =>
    this.exciseCommandService.updateStampRequestPayment(req, id, body);

  submit = (req, id) => this.exciseCommandService.submitStampRequest(req, id);

  review = (req, id, body) => this.exciseCommandService.reviewStampRequest(req, id, body);

  fulfill = (req, id) => this.exciseCommandService.fulfillStampRequest(req, id);
}

