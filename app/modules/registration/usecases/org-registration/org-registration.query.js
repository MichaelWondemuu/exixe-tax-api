export class OrgRegistrationQueryService {
  /**
   * @param {{
   *   orgRegistrationService: import('./org-registration.service.js').OrgRegistrationService;
   *   applicationRepository: import('../../repository/org-registration-application.repository.js').OrgRegistrationApplicationRepository;
   * }} deps
   */
  constructor({ orgRegistrationService, applicationRepository }) {
    this.orgRegistrationService = orgRegistrationService;
    this.applicationRepository = applicationRepository;
  }

  listApplications = (req, queryParams) =>
    this.applicationRepository.findAll(req, {}, queryParams);

  getApplication = (req, id) =>
    this.orgRegistrationService.getApplication(req, id);
}
