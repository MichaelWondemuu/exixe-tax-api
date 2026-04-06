import { parseQueryParams } from '../../../shared/utils/query-parser.js';
import { formatPaginatedResponse } from '../../../shared/utils/pagination-formatter.js';

export class ResourceController {
  constructor({ resourceQueryService, resourceCommandService }) {
    this.resourceQueryService = resourceQueryService;
    this.resourceCommandService = resourceCommandService;
  }

  listResources = async (req, res) => {
    const queryParams = parseQueryParams(req);
    const serviceResponse = await this.resourceQueryService.listResources(
      req,
      queryParams,
    );
    const formattedResponse = formatPaginatedResponse(
      serviceResponse,
      queryParams,
    );
    res.json(formattedResponse);
  };

  getResource = async (req, res) => {
    const serviceResponse = await this.resourceQueryService.getResource(
      req,
      req.params.id,
    );
    res.json(serviceResponse);
  };

  createResource = async (req, res) => {
    const serviceResponse = await this.resourceCommandService.createResource(
      req,
      req.body,
    );
    res.status(201).json(serviceResponse);
  };

  updateResource = async (req, res) => {
    const serviceResponse = await this.resourceCommandService.updateResource(
      req,
      req.params.id,
      req.body,
    );
    res.json(serviceResponse);
  };

  deleteResource = async (req, res) => {
    const response = await this.resourceCommandService.deleteResource(
      req,
      req.params.id,
    );
    res.json(response);
  };
}
