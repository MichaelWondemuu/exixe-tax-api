import { parseQueryParams } from '../../../shared/utils/query-parser.js';
import { formatPaginatedResponse } from '../../../shared/utils/pagination-formatter.js';

export class OrganizationController {
  constructor({ organizationQueryService, organizationCommandService }) {
    this.organizationQueryService = organizationQueryService;
    this.organizationCommandService = organizationCommandService;
  }

  listOrganizations = async (req, res) => {
    const queryParams = parseQueryParams(req);
    const serviceResponse =
      await this.organizationQueryService.listOrganizations(
        req,
        queryParams,
      );
    const formattedResponse = formatPaginatedResponse(
      serviceResponse,
      queryParams,
    );
    res.json(formattedResponse);
  };

  getOrganization = async (req, res) => {
    const serviceResponse = await this.organizationQueryService.getOrganization(
      req,
      req.params.id,
    );
    res.json(serviceResponse);
  };

  getEinvoiceCnf = async (req, res) => {
    const response = await this.organizationQueryService.getEinvoiceCnf(
      req,
      req.params.id,
    );
    const accept = req.get('accept') || '';
    if (accept.includes('text/plain') || req.query.format === 'raw') {
      res.type('text/plain').send(response.data.content);
      return;
    }
    res.json(response);
  };

  createOrganization = async (req, res) => {
    const serviceResponse =
      await this.organizationCommandService.createOrganization(
        req,
        req.body,
      );
    res.status(201).json(serviceResponse);
  };

  updateOrganization = async (req, res) => {
    const serviceResponse =
      await this.organizationCommandService.updateOrganization(
        req,
        req.params.id,
        req.body,
      );
    res.json(serviceResponse);
  };

  deleteOrganization = async (req, res) => {
    const response = await this.organizationCommandService.deleteOrganization(
      req,
      req.params.id,
    );
    res.json(response);
  };

  getOrganizationDetail = async (req, res) => {
    const response =
      await this.organizationQueryService.getOrganizationDetail(
        req,
        req.params.organizationId,
      );
    res.json(response);
  };

  createOrganizationDetail = async (req, res) => {
    const response =
      await this.organizationCommandService.createOrganizationDetail(
        req,
        req.params.organizationId,
        req.body,
      );
    res.status(201).json(response);
  };

  updateOrganizationDetail = async (req, res) => {
    const response =
      await this.organizationCommandService.updateOrganizationDetail(
        req,
        req.params.organizationId,
        req.body,
      );
    res.json(response);
  };

  deleteOrganizationDetail = async (req, res) => {
    const response =
      await this.organizationCommandService.deleteOrganizationDetail(
        req,
        req.params.organizationId,
      );
    res.json(response);
  };

  listUsersInOrganization = async (req, res) => {
    const queryParams = parseQueryParams(req);
    const serviceResponse =
      await this.organizationQueryService.listUsersInOrganization(
        req,
        req.params.organizationID,
        queryParams,
      );
    const formattedResponse = formatPaginatedResponse(
      serviceResponse,
      queryParams,
    );
    res.json(formattedResponse);
  };

  createUserInOrganization = async (req, res) => {
    const serviceResponse =
      await this.organizationCommandService.createUserInOrganization(
        req,
        req.body,
      );
    res.status(201).json(serviceResponse);
  };

  listOrgWallets = async (req, res) => {
    const response =
      await this.organizationQueryService.listOrgWallets(
        req,
        req.params.organizationId,
      );
    res.json(response);
  };

  upsertOrgWallet = async (req, res) => {
    const response = await this.organizationCommandService.upsertOrgWallet(
      req,
      req.params.organizationId,
      req.body,
    );
    const status = response.status === 201 ? 201 : 200;
    res.status(status).json(response);
  };

  deleteOrgWallet = async (req, res) => {
    const { walletType } = req.params;
    const response = await this.organizationCommandService.deleteOrgWallet(
      req,
      req.params.organizationId,
      walletType,
    );
    res.json(response);
  };
}
