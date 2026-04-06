export class VerificationBodyController {
  constructor({ verificationBodyQueryService }) {
    this.verificationBodyQueryService = verificationBodyQueryService;
  }

  listVerificationBodies = async (req, res, next) => {
    try {
      const result =
        await this.verificationBodyQueryService.listVerificationBodies();
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getVerificationBodyById = async (req, res, next) => {
    try {
      const result =
        await this.verificationBodyQueryService.getVerificationBodyById(
          req.params.id,
        );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
