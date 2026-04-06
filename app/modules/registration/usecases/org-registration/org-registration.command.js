export class OrgRegistrationCommandService {
  /**
   * @param {{ orgRegistrationService: import('./org-registration.service.js').OrgRegistrationService }} deps
   */
  constructor({ orgRegistrationService }) {
    this.orgRegistrationService = orgRegistrationService;
  }

  submitApplication = (req, body) =>
    this.orgRegistrationService.submitApplication(req, body);

  updateApplicationStatus = (req, id, payload) =>
    this.orgRegistrationService.updateStatus(req, id, payload);
}
