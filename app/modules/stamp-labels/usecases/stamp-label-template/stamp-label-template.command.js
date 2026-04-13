export class StampLabelTemplateCommandService {
  constructor({ stampLabelCommandService }) {
    this.stampLabelCommandService = stampLabelCommandService;
  }

  create = (req, body) => this.stampLabelCommandService.createTemplate(req, body);

  update = (req, id, body) =>
    this.stampLabelCommandService.updateTemplate(req, id, body);

  delete = (req, id) => this.stampLabelCommandService.deleteTemplate(req, id);
}
