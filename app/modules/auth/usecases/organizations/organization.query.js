import { DataResponseFormat } from '../../../../shared/utils/response-formatter.js';
import {
  OrganizationDetailResponse,
  OrganizationResponse,
} from './organization.response.js';
import { UserResponse } from '../users/user.response.js';

/**
 * Query-side facade for organization use cases.
 * Wraps the organization command service instance (read methods delegate to the same implementation).
 */
export class OrganizationQueryService {
  /**
   * @param {{ organizationService: import('./organization.command.js').OrganizationService }} deps
   */
  constructor({ organizationService }) {
    if (!organizationService) {
      throw new Error('OrganizationQueryService requires organizationService');
    }
    this.organizationService = organizationService;
  }

  listOrganizations = async (req, queryParams) => {
    const result = await this.organizationService.listOrganizations(
      req,
      queryParams,
    );
    if (queryParams?.count) {
      return result;
    }
    const rows = result?.data ?? [];
    const mapped = rows.map((item) => OrganizationResponse.toResponse(item));
    return DataResponseFormat.from(mapped, result?.count ?? mapped.length);
  };

  getOrganization = async (req, id) => {
    const { data } = await this.organizationService.getOrganization(req, id);
    return { data: OrganizationResponse.toResponse(data) };
  };

  getOrganizationDetail = async (req, organizationId) => {
    const { data } = await this.organizationService.getOrganizationDetail(
      req,
      organizationId,
    );
    return {
      data:
        data == null ? data : OrganizationDetailResponse.toResponse(data),
    };
  };

  getEinvoiceCnf = (req, id) =>
    this.organizationService.getEinvoiceCnf(req, id);

  listUsersInOrganization = async (req, organizationId, queryParams = {}) => {
    const result = await this.organizationService.listUsersInOrganization(
      req,
      organizationId,
      queryParams,
    );
    if (queryParams?.count) {
      return result;
    }
    const rows = result?.data ?? [];
    const mapped = rows.map((item) => UserResponse.toResponse(item));
    return DataResponseFormat.from(mapped, result?.count ?? mapped.length);
  };

  listOrgWallets = (req, organizationId) =>
    this.organizationService.listOrgWallets(req, organizationId);
}
