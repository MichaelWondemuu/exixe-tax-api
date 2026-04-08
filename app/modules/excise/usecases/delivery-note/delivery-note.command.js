export class DeliveryNoteCommandService {
  constructor({ exciseCommandService }) {
    this.exciseCommandService = exciseCommandService;
  }

  create = (req, body) => this.exciseCommandService.createDeliveryNote(req, body);

  updateStatus = (req, id, body) =>
    this.exciseCommandService.updateDeliveryNoteStatus(req, id, body);
}

