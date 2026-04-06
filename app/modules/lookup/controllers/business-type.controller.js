export class BusinessTypeController {
  constructor({ businessTypeQueryService }) {
    this.businessTypeQueryService = businessTypeQueryService;
  }

  listBusinessTypes = async (req, res, next) => {
    try {
      const result = await this.businessTypeQueryService.listBusinessTypes();
      res.json(result);
    } catch (error) {
      next(error);
    }
  };  
}
