export class LicensingAuthorityController {
  constructor({ licensingAuthorityQueryService }) {
    this.licensingAuthorityQueryService = licensingAuthorityQueryService;
  }

  listLicensingAuthorities = async (req, res, next) => {
    try {
      const result =
        await this.licensingAuthorityQueryService.listLicensingAuthorities();
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getLicensingAuthorityById = async (req, res, next) => {
    try {
      const result =
        await this.licensingAuthorityQueryService.getLicensingAuthorityById(
          req.params.id,
        );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
