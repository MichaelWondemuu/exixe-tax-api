export class DeliveryNoteQueryService {
  constructor({ exciseQueryService }) {
    this.exciseQueryService = exciseQueryService;
  }

  list = (req, query) => this.exciseQueryService.listDeliveryNotes(req, query);

  getById = (req, id) => this.exciseQueryService.getDeliveryNoteById(req, id);
}

