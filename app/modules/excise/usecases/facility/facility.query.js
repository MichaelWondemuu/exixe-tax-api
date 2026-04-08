export class FacilityQueryService {
  constructor({ exciseQueryService }) {
    this.exciseQueryService = exciseQueryService;
  }

  list = (req, query) => this.exciseQueryService.listFacilities(req, query);

  getById = (req, id) => this.exciseQueryService.getFacilityById(req, id);
}

