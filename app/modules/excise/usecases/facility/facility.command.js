export class FacilityCommandService {
  constructor({ exciseCommandService }) {
    this.exciseCommandService = exciseCommandService;
  }

  create = (req, body) => this.exciseCommandService.createFacility(req, body);

  update = (req, id, body) => this.exciseCommandService.updateFacility(req, id, body);
}

