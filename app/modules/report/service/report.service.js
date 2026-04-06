import { sequelize } from '../../../shared/db/database.js';
import { Sequelize } from 'sequelize';
import { HttpError } from '../../../shared/utils/http-error.js';
import { ReportViewTypeEnum } from '../enums/report.enums.js';
import { DateRangeService } from './date-range.service.js';
import { models } from '../../../shared/db/data-source.js';

const SCHEMA = 'public';

export class ReportService {
  constructor() {
    this.dateRangeService = new DateRangeService();
  }

  /**
   * Resolve allowed organization IDs for current user based on scope.
   * - Non-system users: always restricted to their organization.
   * - System users: restricted by scopeLevel/scopeId when provided; if not set, falls back to no additional restriction.
   * @param {Object} req
   * @returns {Promise<string[]|null>} Array of org IDs, or null when unrestricted (system user without scope configured)
   */
  async getAllowedOrganizationIdsForUser(req) {
    const user = req.user;
    const organizationId = user?.organization?.id || user?.organizationId || null;

    if (!user) return null;

    // Organizational users: locked to their organization
    if (!user.isSystem) {
      return organizationId ? [organizationId] : [];
    }

    // System users: apply scope only when configured
    const scopeLevel = user.scopeLevel || null;
    const scopeId = user.scopeId != null ? String(user.scopeId) : null;
    const scopeSectorIds = Array.isArray(user.scopeSectorIds) ? user.scopeSectorIds : null;

    if (!scopeLevel) return null;
    if (scopeLevel !== 'ORGANIZATION' && !scopeId && (!scopeSectorIds || scopeSectorIds.length === 0)) return null;

    const whereOrg = {};
    if (scopeLevel === 'COUNTRY') whereOrg.country = scopeId;
    if (scopeLevel === 'REGION') whereOrg.regionId = Number(scopeId);
    if (scopeLevel === 'ZONE') whereOrg.zoneId = Number(scopeId);
    if (scopeLevel === 'WOREDA') whereOrg.woredaId = Number(scopeId);
    if (scopeLevel === 'SECTOR') {
      const Op = Sequelize.Op;
      if (scopeSectorIds && scopeSectorIds.length > 0) {
        whereOrg.sectorId = { [Op.in]: scopeSectorIds };
      } else if (scopeId) {
        whereOrg.sectorId = scopeId;
      }
    }
    if (scopeLevel === 'ORGANIZATION') {
      return organizationId ? [organizationId] : [];
    }

    const orgs = await models.Organization.findAll({
      where: whereOrg,
      attributes: ['id'],
      raw: true,
    });
    return orgs.map((o) => o.id).filter(Boolean);
  }

  intersectOrgIds(a, b) {
    if (a == null) return b;
    if (b == null) return a;
    const setB = new Set(b.map((x) => String(x)));
    return a.filter((x) => setB.has(String(x)));
  }

  /**
   * Validate table name (optional - can be used to restrict allowed tables)
   * @param {string} tableName - Table name to validate
   */
  validateTableName(tableName) {
    // Optional: Add validation logic here if you want to restrict allowed tables
    // For now, we'll allow any table name
    if (!tableName || typeof tableName !== 'string') {
      throw new HttpError(400, 'INVALID_TABLE_NAME', 'Table name is required');
    }
  }

  /**
   * Validate access control for showUnderlevel
   * @param {string} userOrgType - User's organization type
   * @param {string} requestedLevel - Requested showUnderlevel
   * @throws {HttpError} If access is denied
   */
  validateShowUnderlevelAccess(userOrgType, requestedLevel) {
    if (!requestedLevel) {
      return; // No restriction if not specified
    }

    // Access control rules:
    // MAIN: Can view MAIN, BRANCH, SUB_BRANCH, SISTER, ALL
    // BRANCH: Can view BRANCH, SUB_BRANCH
    // SUB_BRANCH: Can view SUB_BRANCH only
    // SISTER: Can view SISTER and its children

    const allowedLevels = {
      MAIN: ['MAIN', 'BRANCH', 'SUB_BRANCH', 'SISTER', 'ALL'],
      BRANCH: ['BRANCH', 'SUB_BRANCH'],
      SUB_BRANCH: ['SUB_BRANCH'],
      SISTER: ['SISTER', 'SUB_BRANCH'], // SISTER can view itself and its children (SUB_BRANCH)
    };

    const allowed = allowedLevels[userOrgType] || [];
    if (!allowed.includes(requestedLevel)) {
      throw new HttpError(
        403,
        'ACCESS_DENIED',
        `Your organization type (${userOrgType}) does not have permission to view data at ${requestedLevel} level. Allowed levels: ${allowed.join(', ')}`
      );
    }
  }

  /**
   * Get organization IDs based on showUnderlevel
   * @param {string} userOrgId - User's organization ID
   * @param {string} userOrgType - User's organization type
   * @param {string} showUnderlevel - Requested level to show
   * @returns {Promise<string[]>} Array of organization IDs to filter by
   */
  async getOrganizationIdsForLevel(userOrgId, userOrgType, showUnderlevel) {
    if (!showUnderlevel) {
      // If no level specified, return only user's organization
      return [userOrgId];
    }

    // Get user's organization with relationships
    const userOrg = await models.Organization.findByPk(userOrgId, {
      include: [
        { model: models.Organization, as: 'children', required: false },
        {
          model: models.Organization,
          as: 'sisterOrganizations',
          required: false,
        },
        { model: models.Organization, as: 'parent', required: false },
      ],
    });

    if (!userOrg) {
      return [userOrgId];
    }

    const organizationIds = new Set();

    switch (showUnderlevel) {
      case 'MAIN':
        // Get all MAIN organizations (user's org if MAIN, or find the MAIN parent)
        if (userOrgType === 'MAIN') {
          organizationIds.add(userOrgId);
        } else {
          // Find the MAIN organization in the hierarchy
          let current = userOrg;
          while (current.parent) {
            current = current.parent;
          }
          if (current.organizationType === 'MAIN') {
            organizationIds.add(current.id);
          }
        }
        break;

      case 'BRANCH':
        // Get all BRANCH organizations under the MAIN
        if (userOrgType === 'MAIN') {
          // Get all BRANCH children
          const branches = await models.Organization.findAll({
            where: {
              parentId: userOrgId,
              organizationType: 'BRANCH',
            },
            attributes: ['id'],
          });
          branches.forEach((branch) => organizationIds.add(branch.id));
        } else if (userOrgType === 'BRANCH') {
          organizationIds.add(userOrgId);
        } else {
          // Find the MAIN and get its BRANCH children
          let mainOrg = userOrg;
          while (mainOrg.parent) {
            mainOrg = mainOrg.parent;
          }
          if (mainOrg.organizationType === 'MAIN') {
            const branches = await models.Organization.findAll({
              where: {
                parentId: mainOrg.id,
                organizationType: 'BRANCH',
              },
              attributes: ['id'],
            });
            branches.forEach((branch) => organizationIds.add(branch.id));
          }
        }
        break;

      case 'SUB_BRANCH':
        // Get all SUB_BRANCH organizations
        if (userOrgType === 'MAIN') {
          // Get all SUB_BRANCH under all BRANCH children
          const branches = await models.Organization.findAll({
            where: {
              parentId: userOrgId,
              organizationType: 'BRANCH',
            },
            attributes: ['id'],
          });
          for (const branch of branches) {
            const subBranches = await models.Organization.findAll({
              where: {
                parentId: branch.id,
                organizationType: 'SUB_BRANCH',
              },
              attributes: ['id'],
            });
            subBranches.forEach((sb) => organizationIds.add(sb.id));
          }
        } else if (userOrgType === 'BRANCH') {
          // Get all SUB_BRANCH under this BRANCH
          const subBranches = await models.Organization.findAll({
            where: {
              parentId: userOrgId,
              organizationType: 'SUB_BRANCH',
            },
            attributes: ['id'],
          });
          subBranches.forEach((sb) => organizationIds.add(sb.id));
        } else if (userOrgType === 'SUB_BRANCH') {
          organizationIds.add(userOrgId);
        } else if (userOrgType === 'SISTER') {
          // Get SUB_BRANCH children of SISTER
          const subBranches = await models.Organization.findAll({
            where: {
              parentId: userOrgId,
              organizationType: 'SUB_BRANCH',
            },
            attributes: ['id'],
          });
          subBranches.forEach((sb) => organizationIds.add(sb.id));
        }
        break;

      case 'SISTER':
        // Get all SISTER organizations
        if (userOrgType === 'MAIN') {
          // Get all SISTER organizations (those without parent or with MAIN as parent)
          const sisters = await models.Organization.findAll({
            where: {
              organizationType: 'SISTER',
            },
            attributes: ['id'],
          });
          sisters.forEach((sister) => organizationIds.add(sister.id));
        } else if (userOrgType === 'SISTER') {
          organizationIds.add(userOrgId);
          // Also include sister organizations if they exist
          if (userOrg.sisterOrganizations) {
            userOrg.sisterOrganizations.forEach((sister) =>
              organizationIds.add(sister.id)
            );
          }
        }
        break;

      case 'ALL':
        // Get all MAIN, BRANCH, and SUB_BRANCH organizations
        if (userOrgType === 'MAIN') {
          // Get the MAIN organization
          organizationIds.add(userOrgId);
          
          // Get all BRANCH organizations under this MAIN
          const branches = await models.Organization.findAll({
            where: {
              parentId: userOrgId,
              organizationType: 'BRANCH',
            },
            attributes: ['id'],
          });
          branches.forEach((branch) => organizationIds.add(branch.id));
          
          // Get all SUB_BRANCH organizations under all BRANCH children
          for (const branch of branches) {
            const subBranches = await models.Organization.findAll({
              where: {
                parentId: branch.id,
                organizationType: 'SUB_BRANCH',
              },
              attributes: ['id'],
            });
            subBranches.forEach((sb) => organizationIds.add(sb.id));
          }
        } else {
          // For non-MAIN users, find the MAIN organization first
          let mainOrg = userOrg;
          while (mainOrg.parent) {
            mainOrg = mainOrg.parent;
          }
          if (mainOrg.organizationType === 'MAIN') {
            // Get the MAIN organization
            organizationIds.add(mainOrg.id);
            
            // Get all BRANCH organizations under this MAIN
            const branches = await models.Organization.findAll({
              where: {
                parentId: mainOrg.id,
                organizationType: 'BRANCH',
              },
              attributes: ['id'],
            });
            branches.forEach((branch) => organizationIds.add(branch.id));
            
            // Get all SUB_BRANCH organizations under all BRANCH children
            for (const branch of branches) {
              const subBranches = await models.Organization.findAll({
                where: {
                  parentId: branch.id,
                  organizationType: 'SUB_BRANCH',
                },
                attributes: ['id'],
              });
              subBranches.forEach((sb) => organizationIds.add(sb.id));
            }
          }
        }
        break;

      default:
        return [userOrgId];
    }

    return Array.from(organizationIds);
  }

  /**
   * Build WHERE clause from filter conditions
   * @param {Array} filter - Array of FilterCondition or nested arrays
   * @param {string} tableName - Table name for column reference
   * @returns {string} SQL WHERE clause
   */
  buildWhereClause(filter, tableName) {
    if (!filter || !Array.isArray(filter) || filter.length === 0) {
      return '';
    }

    return filter
      .map((filterGroup) => {
        if (Array.isArray(filterGroup)) {
          // Handle OR conditions within a group
          return `(${filterGroup
            .map((filter) => this.buildCondition(filter, tableName))
            .join(' OR ')})`;
        }
        // Handle AND conditions between groups
        return this.buildCondition(filterGroup, tableName);
      })
      .join(' AND ');
  }

  /**
   * Build a single condition from FilterCondition
   * @param {FilterCondition} filter - Filter condition
   * @param {string} tableName - Table name for column reference
   * @returns {string} SQL condition
   */
  buildCondition(filter, tableName) {
    const { field, operator, value } = filter;

    if (!field) {
      throw new HttpError(400, 'INVALID_FILTER', 'Field is required for filter conditions');
    }

    const columnRef = tableName ? `${tableName}."${field}"` : `"${field}"`;

    // Escape single quotes in values to prevent SQL injection
    const escapeValue = (val) => {
      if (typeof val === 'string') {
        return val.replace(/'/g, "''");
      }
      return val;
    };

    switch (operator) {
      case '=':
      case '>':
      case '<':
      case '>=':
      case '<=':
        return `${columnRef} ${operator} '${escapeValue(value)}'`;
      case 'BETWEEN':
        if (!Array.isArray(value) || value.length !== 2) {
          throw new HttpError(
            400,
            'INVALID_FILTER',
            'BETWEEN operator requires array with 2 values'
          );
        }
        return `${columnRef} BETWEEN '${escapeValue(value[0])}' AND '${escapeValue(value[1])}'`;
      case 'IN':
        if (!Array.isArray(value)) {
          throw new HttpError(
            400,
            'INVALID_FILTER',
            'IN operator requires array of values'
          );
        }
        return `${columnRef} IN (${value.map((v) => `'${escapeValue(v)}'`).join(',')})`;
      default:
        throw new HttpError(
          400,
          'INVALID_FILTER',
          `Unsupported operator: ${operator}`
        );
    }
  }

  /**
   * Build SQL query for report generation
   * @param {Object} params - Query parameters
   * @returns {string} SQL query
   */
  buildQuery({
    tableName,
    dateField,
    groupBy = [],
    whereClause,
    showByColumn,
    organizationId, // Keep for backward compatibility
    organizationIds, // New: array of organization IDs
    dateFilter,
    includeOrganizationInfo = false, // Whether to include org name and type
  }) {
    const schemaTable = `${SCHEMA}."${tableName}"`;

    if (showByColumn && showByColumn.trim() === '') {
      throw new HttpError(
        400,
        'INVALID_QUERY',
        'Invalid query: showByColumn cannot be empty.'
      );
    }

    const sanitizedShowByColumn = showByColumn?.replace(/"/g, '').trim() || null;

    const selectShowBy = sanitizedShowByColumn
      ? `${schemaTable}."${sanitizedShowByColumn}" AS groupedBy`
      : null;
    const groupByClause = sanitizedShowByColumn ? 'groupedBy' : null;

    // Add organization info if requested
    const organizationInfoFields = includeOrganizationInfo
      ? `${SCHEMA}."organizations".name AS organization_name, ${SCHEMA}."organizations".organization_type AS organization_level`
      : null;

    const timeGroupings = groupBy
      .map((unit) => {
        if (unit === 'year') {
          return `EXTRACT(YEAR FROM ${schemaTable}.${dateField})::integer AS ${unit}`;
        }
        if (unit === 'week') {
          // Return week number with year for unambiguous identification
          return `EXTRACT(WEEK FROM ${schemaTable}.${dateField})::integer AS ${unit}, EXTRACT(YEAR FROM ${schemaTable}.${dateField})::integer AS ${unit}_year`;
        }
        if (unit === 'month') {
          // Return month name and year separately
          return `TO_CHAR(${schemaTable}.${dateField}, 'Month') AS ${unit}, EXTRACT(YEAR FROM ${schemaTable}.${dateField})::integer AS ${unit}_year, EXTRACT(MONTH FROM ${schemaTable}.${dateField})::integer AS ${unit}_num`;
        }
        return `DATE_TRUNC('${unit}', ${schemaTable}.${dateField})::timestamp AS ${unit}`;
      })
      .join(', ');

    const selectFields = [
      selectShowBy,
      organizationInfoFields,
      timeGroupings,
      'COUNT(*) AS count',
    ]
      .filter(Boolean)
      .join(', ');

    const groupings = [
      ...groupBy.map((unit) => {
        if (unit === 'year') {
          return `EXTRACT(YEAR FROM ${schemaTable}.${dateField})`;
        }
        if (unit === 'week') {
          // Group by both week and year for proper grouping
          return `EXTRACT(WEEK FROM ${schemaTable}.${dateField}), EXTRACT(YEAR FROM ${schemaTable}.${dateField})`;
        }
        if (unit === 'month') {
          // Group by month name, year, and month number for proper grouping
          return `TO_CHAR(${schemaTable}.${dateField}, 'Month'), EXTRACT(YEAR FROM ${schemaTable}.${dateField}), EXTRACT(MONTH FROM ${schemaTable}.${dateField})`;
        }
        return `DATE_TRUNC('${unit}', ${schemaTable}.${dateField})::timestamp`;
      }),
      groupByClause,
      // Add organization fields to GROUP BY if organization info is included
      ...(includeOrganizationInfo
        ? [
            `${schemaTable}.organization_id`,
            `${SCHEMA}."organizations".name`,
            `${SCHEMA}."organizations".organization_type`,
          ]
        : []),
    ].filter(Boolean);

    const groupByStatement = groupings.length
      ? `GROUP BY ${groupings.join(', ')}`
      : '';

    const baseWhereClause = `${schemaTable}.deleted_at IS NULL`;
    const sanitizedWhereClause = whereClause?.replace(
      /"organizationId"/g,
      'organization_id'
    );

    // Combine all WHERE conditions
    const whereConditions = [baseWhereClause];
    
    // Add organization filter
    if (organizationIds && Array.isArray(organizationIds) && organizationIds.length > 0) {
      // Filter by multiple organization IDs
      const orgIdsStr = organizationIds.map((id) => `'${id}'`).join(',');
      whereConditions.push(`${schemaTable}.organization_id IN (${orgIdsStr})`);
    } else if (organizationId) {
      // Fallback to single organization ID for backward compatibility
      whereConditions.push(`${schemaTable}.organization_id = '${organizationId}'`);
    }
    
    // Add date filter if provided
    if (dateFilter) {
      whereConditions.push(dateFilter);
    }
    
    // Add custom filters if provided
    if (sanitizedWhereClause) {
      whereConditions.push(`(${sanitizedWhereClause})`);
    }

    const finalWhereClause = whereConditions.join(' AND ');

    // Build ORDER BY clause - handle week specially to order by year first, then week
    let orderByClause = '';
    if (groupByStatement) {
      const orderByParts = groupBy.map((unit) => {
        if (unit === 'week') {
          // Order by year first, then week number
          return `EXTRACT(YEAR FROM ${schemaTable}.${dateField}), EXTRACT(WEEK FROM ${schemaTable}.${dateField})`;
        }
        if (unit === 'month') {
          // Order by year first, then month number (not name) for chronological order
          return `EXTRACT(YEAR FROM ${schemaTable}.${dateField}), EXTRACT(MONTH FROM ${schemaTable}.${dateField})`;
        }
        if (unit === 'year') {
          return `EXTRACT(YEAR FROM ${schemaTable}.${dateField})`;
        }
        return `DATE_TRUNC('${unit}', ${schemaTable}.${dateField})::timestamp`;
      });
      if (groupByClause) {
        orderByParts.push(groupByClause);
      }
      orderByClause = `ORDER BY ${orderByParts.join(', ')}`;
    }

    // Add JOIN with organizations table if organization info is needed
    const joinClause = includeOrganizationInfo
      ? `INNER JOIN ${SCHEMA}."organizations" ON ${schemaTable}.organization_id = ${SCHEMA}."organizations".id`
      : '';

    return `
      SELECT ${selectFields}
      FROM ${schemaTable}
      ${joinClause}
      WHERE ${finalWhereClause}
      ${groupByStatement}
      ${orderByClause}
    `.trim();
  }

  /**
   * Process raw data based on showing method
   * @param {Array} rawData - Raw query results
   * @param {ReportQuery} dto - Report query DTO
   * @returns {Object|Array} Processed data
   */
  processData(rawData, dto) {
    const { showingMethod, showingPercent: showingPercentStr } = dto;
    const showingPercent = showingPercentStr === 'true';

    const totalCount = showingPercent
      ? rawData.reduce((sum, item) => sum + Number(item.count || 0), 0)
      : 0;

    const processedData = rawData.map((item) => {
      // Transform week number to just the number if week grouping is used
      const processedItem = { ...item };
      
      if (dto.groupBy && dto.groupBy.includes('week') && item.week !== undefined) {
        // Keep just the week number as integer
        processedItem.week = Number(item.week);
        // Remove the week_year field if it exists
        delete processedItem.week_year;
      }

      // Transform month to month name if month grouping is used
      if (dto.groupBy && dto.groupBy.includes('month') && item.month !== undefined) {
        // TO_CHAR returns month name with trailing spaces, trim it
        const monthName = String(item.month).trim();
        processedItem.month = monthName;
        // Remove the month_year and month_num fields as they're no longer needed
        delete processedItem.month_year;
        delete processedItem.month_num;
      }

      return {
        ...processedItem,
        percent: showingPercent
          ? ((Number(item.count || 0) / totalCount) * 100).toFixed(1) + '%'
          : undefined,
      };
    });

    if (showingMethod === ReportViewTypeEnum.LINEAR) {
      const labels = processedData.map((item) => {
        // Prioritize month if present, then week, then groupedBy, then other fields
        if (item.month !== undefined) {
          return item.month; // Month name (e.g., "January")
        }
        if (item.week !== undefined) {
          return String(item.week); // Convert to string for label
        }
        return item.groupedBy || item.application || item.count || 'Unknown';
      });
      const data = processedData.map((item) => Number(item.count || 0));
      const percent = showingPercent
        ? processedData.map((item) => item.percent)
        : undefined;

      return showingPercent ? { labels, percent, data } : { labels, data };
    }

    return processedData;
  }

  /**
   * Generate report
   * @param {ReportQuery} dto - Report query DTO
   * @param {Object} req - Express request object
   * @returns {Promise<Object|Array>} Report data
   */
  async generateReport(dto, req) {
    const organizationId = req.user?.organization?.id;

    try {
      const allowedOrgIds = await this.getAllowedOrganizationIdsForUser(req);

      // Get user's organization type for access control
      const userOrg = organizationId
        ? await models.Organization.findByPk(organizationId, {
            attributes: ['id', 'organizationType'],
          })
        : null;

      if (!req.user?.isSystem && !userOrg) {
        throw new HttpError(
          404,
          'ORGANIZATION_NOT_FOUND',
          'User organization not found'
        );
      }

      const userOrgType = userOrg?.organizationType || 'MAIN';

      // Validate access control for showUnderlevel
      if (dto.showUnderlevel) {
        this.validateShowUnderlevelAccess(userOrgType, dto.showUnderlevel);
      }

      // Get organization IDs based on showUnderlevel
      let organizationIds = organizationId ? [organizationId] : [];
      if (dto.showUnderlevel) {
        organizationIds = await this.getOrganizationIdsForLevel(
          organizationId,
          userOrgType,
          dto.showUnderlevel
        );
      }

      // Enforce scope restriction (system users scoped, org users always)
      organizationIds = this.intersectOrgIds(organizationIds, allowedOrgIds);

      if (organizationIds.length === 0) {
        throw new HttpError(
          404,
          'NO_ORGANIZATIONS_FOUND',
          `No organizations found for level: ${dto.showUnderlevel}`
        );
      }

      // Validate table name (optional - can be enabled if needed)
      // this.validateTableName(dto.tableName);
      dto.tableName = dto.tableName || 'items';
      const schemaTable = `${SCHEMA}."${dto.tableName}"`;

      const showByColumn = dto.showBy ? `"${dto.showBy}"` : null;

      const whereClause = this.buildWhereClause(dto.filter, schemaTable);
      
      // Build date filter if dateRange is provided
      let dateFilter = '';
      if (dto.dateRange && dto.dateRange.range) {
        const dateField = dto.dateField || 'created_at';
        // Remove quotes from dateField if present
        const cleanDateField = dateField.replace(/"/g, '');
        dateFilter = this.dateRangeService.buildDateFilter(
          cleanDateField,
          dto.dateRange.range,
          dto.dateRange.startDate,
          dto.dateRange.endDate,
          schemaTable
        );
      }

      const query = this.buildQuery({
        tableName: dto.tableName,
        dateField: dto.dateField || '"created_at"',
        groupBy: dto.groupBy || [],
        whereClause,
        showByColumn,
        organizationId: organizationId, // Keep for backward compatibility
        organizationIds: organizationIds, // Pass array of organization IDs
        dateFilter,
        includeOrganizationInfo: !!dto.showUnderlevel, // Include org info when showUnderlevel is used (including "ALL")
      });

      // When using type: Sequelize.QueryTypes.SELECT, sequelize.query returns results directly as an array
      const rawData = await sequelize.query(query, {
        type: Sequelize.QueryTypes.SELECT,
      });

      // Ensure rawData is an array (safety check)
      if (!Array.isArray(rawData)) {
        throw new HttpError(
          500,
          'INVALID_QUERY_RESULT',
          'Query did not return an array of results'
        );
      }

      return this.processData(rawData, dto);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(
        500,
        'REPORT_GENERATION_FAILED',
        `Failed to generate report: ${error.message}`
      );
    }
  }

  /**
   * POS order & invoice report by organization geography (country, country+zone, country+zone+woreda)
   * with date range and optional comparative (current vs previous period).
   * Optional filters: taxType, taxName, sectorId, organizationIds.
   * @param {Object} body - { country, regionId?, zoneId?, woredaId?, sectorId?, organizationIds?, taxType?, taxName?, dateRange, compareWithPrevious? }
   * @param {Object} req - Express request
   * @returns {Promise<Object>} { geography, current, previous?, comparison? }
   */
  async getPosOrderInvoiceByGeography(body, req) {
    const { country, regionId, zoneId, woredaId, sectorId, sectorIds, organizationIds: bodyOrgIds, taxType, taxName, dateRange, compareWithPrevious } = body || {};
    if (!country || typeof country !== 'string' || !country.trim()) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'country is required');
    }
    if (!dateRange || !dateRange.range) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'dateRange.range is required');
    }

    const Op = Sequelize.Op;
    const { startDate: periodStart, endDate: periodEnd } = this.dateRangeService.getDateRange(
      dateRange.range,
      dateRange.startDate,
      dateRange.endDate
    );

    const allowedOrgIds = await this.getAllowedOrganizationIdsForUser(req);

    const whereOrg = { country: country.trim() };
    if (regionId != null) whereOrg.regionId = Number(regionId);
    if (zoneId != null) whereOrg.zoneId = Number(zoneId);
    if (woredaId != null) whereOrg.woredaId = Number(woredaId);
    if (Array.isArray(sectorIds) && sectorIds.length > 0) {
      whereOrg.sectorId = { [Op.in]: sectorIds };
    } else if (sectorId != null && sectorId !== '') {
      whereOrg.sectorId = sectorId;
    }

    const geographyLabels = { country: country.trim(), region: null, zone: null, woreda: null };
    const [region, zone, woreda] = await Promise.all([
      regionId != null ? models.Region.findByPk(Number(regionId)) : null,
      zoneId != null ? models.Zone.findByPk(Number(zoneId)) : null,
      woredaId != null ? models.Woreda.findByPk(Number(woredaId)) : null,
    ]);
    if (region) geographyLabels.region = region.description;
    if (zone) geographyLabels.zone = zone.description;
    if (woreda) geographyLabels.woreda = woreda.description;

    let orgs = await models.Organization.findAll({
      where: whereOrg,
      attributes: ['id'],
      raw: true,
    });
    if (Array.isArray(allowedOrgIds)) {
      const allowedSet = new Set(allowedOrgIds.map((id) => String(id)));
      orgs = orgs.filter((o) => allowedSet.has(String(o.id)));
    }
    if (Array.isArray(bodyOrgIds) && bodyOrgIds.length > 0) {
      const idSet = new Set(bodyOrgIds.map((id) => String(id)));
      orgs = orgs.filter((o) => idSet.has(String(o.id)));
    }
    const organizationIds = orgs.map((o) => o.id).filter(Boolean);
    if (organizationIds.length === 0) {
      const emptyCurrent = {
        orderCount: 0,
        orderSubtotal: 0,
        orderTaxAmount: 0,
        orderTotal: 0,
        orderPaidAmount: 0,
        orderDiscountAmount: 0,
        invoiceCount: 0,
        invoiceTotal: 0,
        invoiceTaxValue: 0,
        startDate: periodStart,
        endDate: periodEnd,
      };
      return {
        geography: geographyLabels,
        current: emptyCurrent,
        ...(compareWithPrevious
          ? {
              previous: null,
              comparison: null,
            }
          : {}),
      };
    }

    let taxIdsFromName = [];
    if (taxName && typeof taxName === 'string' && taxName.trim()) {
      const taxes = await models.Tax.findAll({
        where: { name: { [Op.iLike]: `%${taxName.trim()}%` } },
        attributes: ['id'],
        raw: true,
      });
      taxIdsFromName = taxes.map((t) => t.id);
    }

    const currentWhere = {
      organizationId: { [Op.in]: organizationIds },
      createdAt: { [Op.gte]: periodStart, [Op.lte]: periodEnd },
    };
    if (taxType && String(taxType).trim()) currentWhere.taxType = String(taxType).trim();
    if (taxIdsFromName.length > 0) currentWhere.taxId = { [Op.in]: taxIdsFromName };

    const invWhere = {
      organizationId: { [Op.in]: organizationIds },
      createdAt: { [Op.gte]: periodStart, [Op.lte]: periodEnd },
    };
    if (taxType && String(taxType).trim()) invWhere.taxType = String(taxType).trim();
    if (taxIdsFromName.length > 0) invWhere.taxId = { [Op.in]: taxIdsFromName };

    const [
      orderCount,
      orderSubtotalResult,
      orderTaxAmountResult,
      orderTotalResult,
      orderPaidAmountResult,
      orderDiscountResult,
      invoiceCount,
      invoiceTotalResult,
      invoiceTaxResult,
    ] = await Promise.all([
      models.PosOrder.count({ where: currentWhere }),
      models.PosOrder.sum('subtotal', { where: currentWhere }),
      models.PosOrder.sum('tax_amount', { where: currentWhere }),
      models.PosOrder.sum('total', { where: currentWhere }),
      models.PosOrder.sum('paid_amount', { where: currentWhere }),
      models.PosOrder.sum('discount_amount', { where: currentWhere }),
      models.PosInvoice.count({ where: invWhere }),
      models.PosInvoice.sum('total_value', { where: invWhere }),
      models.PosInvoice.sum('tax_value', { where: invWhere }),
    ]);

    const current = {
      orderCount: orderCount || 0,
      orderSubtotal: Number(orderSubtotalResult) || 0,
      orderTaxAmount: Number(orderTaxAmountResult) || 0,
      orderTotal: Number(orderTotalResult) || 0,
      orderPaidAmount: Number(orderPaidAmountResult) || 0,
      orderDiscountAmount: Number(orderDiscountResult) || 0,
      invoiceCount: invoiceCount || 0,
      invoiceTotal: Number(invoiceTotalResult) || 0,
      invoiceTaxValue: Number(invoiceTaxResult) || 0,
      startDate: periodStart,
      endDate: periodEnd,
    };

    let previous = null;
    let comparison = null;

    if (compareWithPrevious) {
      const periodMs = periodEnd - periodStart;
      const previousEnd = new Date(periodStart.getTime() - 1);
      const previousStart = new Date(previousEnd.getTime() - periodMs);

      const prevWhereOrder = {
        organizationId: { [Op.in]: organizationIds },
        createdAt: { [Op.gte]: previousStart, [Op.lte]: previousEnd },
      };
      const prevWhereInvoice = {
        organizationId: { [Op.in]: organizationIds },
        createdAt: { [Op.gte]: previousStart, [Op.lte]: previousEnd },
      };

      const [
        prevOrderCount,
        prevOrderSubtotalR,
        prevOrderTaxR,
        prevOrderTotalR,
        prevOrderPaidR,
        prevOrderDiscountR,
        prevInvoiceCount,
        prevInvoiceTotalR,
        prevInvoiceTaxR,
      ] = await Promise.all([
        models.PosOrder.count({ where: prevWhereOrder }),
        models.PosOrder.sum('subtotal', { where: prevWhereOrder }),
        models.PosOrder.sum('tax_amount', { where: prevWhereOrder }),
        models.PosOrder.sum('total', { where: prevWhereOrder }),
        models.PosOrder.sum('paid_amount', { where: prevWhereOrder }),
        models.PosOrder.sum('discount_amount', { where: prevWhereOrder }),
        models.PosInvoice.count({ where: prevWhereInvoice }),
        models.PosInvoice.sum('total_value', { where: prevWhereInvoice }),
        models.PosInvoice.sum('tax_value', { where: prevWhereInvoice }),
      ]);

      previous = {
        orderCount: prevOrderCount || 0,
        orderSubtotal: Number(prevOrderSubtotalR) || 0,
        orderTaxAmount: Number(prevOrderTaxR) || 0,
        orderTotal: Number(prevOrderTotalR) || 0,
        orderPaidAmount: Number(prevOrderPaidR) || 0,
        orderDiscountAmount: Number(prevOrderDiscountR) || 0,
        invoiceCount: prevInvoiceCount || 0,
        invoiceTotal: Number(prevInvoiceTotalR) || 0,
        invoiceTaxValue: Number(prevInvoiceTaxR) || 0,
        startDate: previousStart,
        endDate: previousEnd,
      };

      const pct = (curr, prev) =>
        prev === 0 ? (curr === 0 ? 0 : 100) : Math.round(((curr - prev) / prev) * 1000) / 10;
      comparison = {
        orderCountChangePercent: pct(current.orderCount, previous.orderCount),
        orderSubtotalChangePercent: pct(current.orderSubtotal, previous.orderSubtotal),
        orderTaxAmountChangePercent: pct(current.orderTaxAmount, previous.orderTaxAmount),
        orderTotalChangePercent: pct(current.orderTotal, previous.orderTotal),
        orderPaidAmountChangePercent: pct(current.orderPaidAmount, previous.orderPaidAmount),
        invoiceCountChangePercent: pct(current.invoiceCount, previous.invoiceCount),
        invoiceTotalChangePercent: pct(current.invoiceTotal, previous.invoiceTotal),
        invoiceTaxValueChangePercent: pct(current.invoiceTaxValue, previous.invoiceTaxValue),
        orderCountDelta: current.orderCount - previous.orderCount,
        orderSubtotalDelta: current.orderSubtotal - previous.orderSubtotal,
        orderTaxAmountDelta: current.orderTaxAmount - previous.orderTaxAmount,
        orderTotalDelta: current.orderTotal - previous.orderTotal,
        orderPaidAmountDelta: current.orderPaidAmount - previous.orderPaidAmount,
        invoiceCountDelta: current.invoiceCount - previous.invoiceCount,
        invoiceTotalDelta: current.invoiceTotal - previous.invoiceTotal,
        invoiceTaxValueDelta: current.invoiceTaxValue - previous.invoiceTaxValue,
      };
    }

    return {
      geography: geographyLabels,
      current,
      ...(previous !== null ? { previous } : {}),
      ...(comparison !== null ? { comparison } : {}),
    };
  }

  /**
   * POS analytics/dashboard summary by status (orders by status, invoices by status and eims_status).
   * Optional geography and date range. Optional filters: taxType, taxName, sectorId, organizationIds.
   * @param {Object} body - { country?, regionId?, zoneId?, woredaId?, sectorId?, organizationIds?, taxType?, taxName?, dateRange? }
   * @param {Object} req - Express request (used for org filter if no geography)
   * @returns {Promise<Object>} { ordersByStatus, invoicesByStatus, invoicesByEimsStatus?, dateRange? }
   */
  async getPosDashboardSummaryByStatus(body, req) {
    const { country, regionId, zoneId, woredaId, sectorId, sectorIds, organizationIds: bodyOrgIds, taxType, taxName, dateRange } = body || {};
    const Op = Sequelize.Op;

    let organizationIds = [];
    const geographyLabels = { country: null, region: null, zone: null, woreda: null };
    const allowedOrgIds = await this.getAllowedOrganizationIdsForUser(req);

    if (country && typeof country === 'string' && country.trim()) {
      geographyLabels.country = country.trim();
      const whereOrg = { country: country.trim() };
      if (regionId != null) whereOrg.regionId = Number(regionId);
      if (zoneId != null) whereOrg.zoneId = Number(zoneId);
      if (woredaId != null) whereOrg.woredaId = Number(woredaId);
      if (Array.isArray(sectorIds) && sectorIds.length > 0) {
        whereOrg.sectorId = { [Op.in]: sectorIds };
      } else if (sectorId != null && sectorId !== '') {
        whereOrg.sectorId = sectorId;
      }

      const [region, zone, woreda] = await Promise.all([
        regionId != null ? models.Region.findByPk(Number(regionId)) : null,
        zoneId != null ? models.Zone.findByPk(Number(zoneId)) : null,
        woredaId != null ? models.Woreda.findByPk(Number(woredaId)) : null,
      ]);
      if (region) geographyLabels.region = region.description;
      if (zone) geographyLabels.zone = zone.description;
      if (woreda) geographyLabels.woreda = woreda.description;

      let orgs = await models.Organization.findAll({
        where: whereOrg,
        attributes: ['id'],
        raw: true,
      });
      if (Array.isArray(allowedOrgIds)) {
        const allowedSet = new Set(allowedOrgIds.map((id) => String(id)));
        orgs = orgs.filter((o) => allowedSet.has(String(o.id)));
      }
      if (Array.isArray(bodyOrgIds) && bodyOrgIds.length > 0) {
        const idSet = new Set(bodyOrgIds.map((id) => String(id)));
        orgs = orgs.filter((o) => idSet.has(String(o.id)));
      }
      organizationIds = orgs.map((o) => o.id).filter(Boolean);
    } else if (Array.isArray(bodyOrgIds) && bodyOrgIds.length > 0) {
      organizationIds = bodyOrgIds.filter((id) => id != null && String(id).trim() !== '');
    } else {
      const organizationId = req.user?.organization?.id;
      if (organizationId) {
        organizationIds = [organizationId];
      }
    }

    // Enforce scope restriction
    organizationIds = this.intersectOrgIds(organizationIds, allowedOrgIds) || [];

    let dateFilter = {};
    let periodStart = null;
    let periodEnd = null;
    if (dateRange && dateRange.range) {
      const range = this.dateRangeService.getDateRange(
        dateRange.range,
        dateRange.startDate,
        dateRange.endDate
      );
      periodStart = range.startDate;
      periodEnd = range.endDate;
      dateFilter = { createdAt: { [Op.gte]: periodStart, [Op.lte]: periodEnd } };
    }

    let taxIdsFromName = [];
    if (taxName && typeof taxName === 'string' && taxName.trim()) {
      const taxes = await models.Tax.findAll({
        where: { name: { [Op.iLike]: `%${taxName.trim()}%` } },
        attributes: ['id'],
        raw: true,
      });
      taxIdsFromName = taxes.map((t) => t.id);
    }

    const baseOrderWhere = {
      ...(organizationIds.length > 0 ? { organizationId: { [Op.in]: organizationIds } } : {}),
      ...dateFilter,
      ...(taxType && String(taxType).trim() ? { taxType: String(taxType).trim() } : {}),
      ...(taxIdsFromName.length > 0 ? { taxId: { [Op.in]: taxIdsFromName } } : {}),
    };
    const baseInvoiceWhere = {
      ...(organizationIds.length > 0 ? { organizationId: { [Op.in]: organizationIds } } : {}),
      ...dateFilter,
      ...(taxType && String(taxType).trim() ? { taxType: String(taxType).trim() } : {}),
      ...(taxIdsFromName.length > 0 ? { taxId: { [Op.in]: taxIdsFromName } } : {}),
    };

    const [orderRows, invoiceRows, invoiceEimsRows] = await Promise.all([
      models.PosOrder.findAll({
        where: baseOrderWhere,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('subtotal')), 0), 'subtotal'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('tax_amount')), 0), 'taxAmount'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total')), 0), 'total'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('paid_amount')), 0), 'paidAmount'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('discount_amount')), 0), 'discountAmount'],
        ],
        group: ['status'],
        raw: true,
      }),
      models.PosInvoice.findAll({
        where: baseInvoiceWhere,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_value')), 0), 'totalValue'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('tax_value')), 0), 'taxValue'],
        ],
        group: ['status'],
        raw: true,
      }),
      models.PosInvoice.findAll({
        where: baseInvoiceWhere,
        attributes: [
          'eims_status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_value')), 0), 'totalValue'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('tax_value')), 0), 'taxValue'],
        ],
        group: ['eims_status'],
        raw: true,
      }),
    ]);

    const toNum = (v) => (v != null ? Number(v) : 0);

    const ordersByStatus = orderRows.map((r) => ({
      status: r.status || 'unknown',
      count: toNum(r.count),
      subtotal: toNum(r.subtotal),
      taxAmount: toNum(r.taxAmount),
      total: toNum(r.total),
      paidAmount: toNum(r.paidAmount),
      discountAmount: toNum(r.discountAmount),
    }));

    const invoicesByStatus = invoiceRows.map((r) => ({
      status: r.status || 'unknown',
      count: toNum(r.count),
      totalValue: toNum(r.totalValue),
      taxValue: toNum(r.taxValue),
    }));

    const invoicesByEimsStatus = invoiceEimsRows.map((r) => ({
      eims_status: r.eims_status || 'unknown',
      count: toNum(r.count),
      totalValue: toNum(r.totalValue),
      taxValue: toNum(r.taxValue),
    }));

    const result = {
      geography: geographyLabels.country != null ? geographyLabels : undefined,
      ordersByStatus,
      invoicesByStatus,
      invoicesByEimsStatus,
    };
    if (periodStart && periodEnd) {
      result.dateRange = { startDate: periodStart, endDate: periodEnd };
    }
    return result;
  }

  /**
   * Compute status (green | warning | red) for a metric vs expected min/max and risk threshold.
   * @param {number} actual - Actual value
   * @param {number|null} expectedMin - Expected minimum
   * @param {number|null} expectedMax - Expected maximum
   * @param {number} riskThresholdPercent - Allowable deviation % (e.g. 30)
   * @returns {'green'|'warning'|'red'|'n/a'}
   */
  _metricStatus(actual, expectedMin, expectedMax, riskThresholdPercent) {
    const min = expectedMin != null ? Number(expectedMin) : null;
    const max = expectedMax != null ? Number(expectedMax) : null;
    if (min == null && max == null) return 'n/a';
    const lo = min ?? -Infinity;
    const hi = max ?? Infinity;
    if (actual >= lo && actual <= hi) return 'green';
    const threshold = riskThresholdPercent != null ? Number(riskThresholdPercent) : 30;
    let deviationPercent = 0;
    if (actual < lo) {
      deviationPercent = lo > 0 ? ((lo - actual) / lo) * 100 : (actual < 0 ? 100 : 0);
    } else {
      deviationPercent = hi > 0 ? ((actual - hi) / hi) * 100 : 100;
    }
    if (deviationPercent <= threshold) return 'warning';
    return 'red';
  }

  /**
   * Sectors performance report: expected (from Sector) vs actual (from POS orders) with green/warning/red.
   * POST /reports/sectors-performance
   * Body: { dateRange: { range, startDate?, endDate? }, country?, regionId?, zoneId?, woredaId?, sectorId?, organizationIds?, verificationBodyName?, licensingAuthorityName? }
   */
  async getSectorsPerformance(body, req) {
    const {
      dateRange,
      country,
      regionId,
      zoneId,
      woredaId,
      sectorId,
      sectorIds,
      organizationIds: bodyOrgIds,
      verificationBodyName,
      licensingAuthorityName,
    } = body || {};
    if (!dateRange || !dateRange.range) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'dateRange.range is required');
    }

    const Op = Sequelize.Op;
    const { startDate: periodStart, endDate: periodEnd } = this.dateRangeService.getDateRange(
      dateRange.range,
      dateRange.startDate,
      dateRange.endDate
    );
    const daysInPeriod = Math.max(1, Math.ceil((periodEnd - periodStart) / (24 * 60 * 60 * 1000)));

    let organizationIds = [];
    const whereOrg = {};
    const allowedOrgIds = await this.getAllowedOrganizationIdsForUser(req);
    if (country && typeof country === 'string' && country.trim()) {
      whereOrg.country = country.trim();
      if (regionId != null) whereOrg.regionId = Number(regionId);
      if (zoneId != null) whereOrg.zoneId = Number(zoneId);
      if (woredaId != null) whereOrg.woredaId = Number(woredaId);
    }
    if (Array.isArray(sectorIds) && sectorIds.length > 0) {
      whereOrg.sectorId = { [Op.in]: sectorIds };
    } else if (sectorId != null && sectorId !== '') {
      whereOrg.sectorId = sectorId;
    }

    if (Object.keys(whereOrg).length > 0) {
      let orgs = await models.Organization.findAll({
        where: whereOrg,
        attributes: ['id', 'sectorId'],
        raw: true,
      });
      if (Array.isArray(allowedOrgIds)) {
        const allowedSet = new Set(allowedOrgIds.map((id) => String(id)));
        orgs = orgs.filter((o) => allowedSet.has(String(o.id)));
      }
      if (Array.isArray(bodyOrgIds) && bodyOrgIds.length > 0) {
        const idSet = new Set(bodyOrgIds.map((id) => String(id)));
        orgs = orgs.filter((o) => idSet.has(String(o.id)));
      }
      organizationIds = orgs.map((o) => o.id).filter(Boolean);
    } else if (Array.isArray(bodyOrgIds) && bodyOrgIds.length > 0) {
      organizationIds = bodyOrgIds.filter((id) => id != null && String(id).trim() !== '');
    } else {
      const organizationId = req.user?.organization?.id;
      if (organizationId) organizationIds = [organizationId];
    }

    // Enforce scope restriction
    organizationIds = this.intersectOrgIds(organizationIds, allowedOrgIds) || [];

    const sectorIdsToReport = new Set();
    if (Array.isArray(sectorIds) && sectorIds.length > 0) {
      sectorIds.forEach((id) => id != null && String(id).trim() !== '' && sectorIdsToReport.add(id));
    }
    if (sectorIdsToReport.size === 0 && sectorId != null && sectorId !== '') {
      sectorIdsToReport.add(sectorId);
    }
    if (sectorIdsToReport.size === 0 && organizationIds.length > 0) {
      const orgsWithSector = await models.Organization.findAll({
        where: { id: { [Op.in]: organizationIds }, sectorId: { [Op.ne]: null } },
        attributes: ['sectorId'],
        raw: true,
      });
      orgsWithSector.forEach((o) => sectorIdsToReport.add(o.sectorId));
    }

    if (sectorIdsToReport.size === 0) {
      return {
        dateRange: { startDate: periodStart, endDate: periodEnd },
        daysInPeriod,
        sectors: [],
      };
    }

    let sectors = await models.Sector.findAll({
      where: { id: { [Op.in]: Array.from(sectorIdsToReport) } },
      attributes: [
        'id',
        'name',
        'code',
        'division',
        'majorGroup',
        'group',
        'licensingCategory',
        'verificationBodyId',
        'licensingAuthorityId',
        'expectedDailyTxnMin',
        'expectedDailyTxnMax',
        'expectedAvgTicketMin',
        'expectedAvgTicketMax',
        'expectedOpenTime',
        'expectedCloseTime',
        'riskThresholdPercent',
      ],
      include: [
        { model: models.VerificationBody, as: 'verificationBody', required: false, attributes: ['id', 'name'] },
        { model: models.LicensingAuthority, as: 'licensingAuthority', required: false, attributes: ['id', 'name'] },
      ],
    });
    if (verificationBodyName != null && String(verificationBodyName).trim() !== '') {
      const vbMatch = String(verificationBodyName).trim().toLowerCase();
      sectors = sectors.filter((s) => (s.verificationBody?.name ?? '').toLowerCase().includes(vbMatch));
    }
    if (licensingAuthorityName != null && String(licensingAuthorityName).trim() !== '') {
      const laMatch = String(licensingAuthorityName).trim().toLowerCase();
      sectors = sectors.filter((s) => (s.licensingAuthority?.name ?? '').toLowerCase().includes(laMatch));
    }
    const sectorById = {};
    sectors.forEach((s) => { sectorById[s.id] = s; });

    const orderWhere = {
      organizationId: { [Op.in]: organizationIds },
      createdAt: { [Op.gte]: periodStart, [Op.lte]: periodEnd },
    };

    const orgAttr = [
      'id',
      'name',
      'sectorId',
      'country',
      'regionId',
      'zoneId',
      'woredaId',
      'latitude',
      'longitude',
      'expectedDailyTxnMin',
      'expectedDailyTxnMax',
      'expectedAvgTicketMin',
      'expectedAvgTicketMax',
      'expectedOpenTime',
      'expectedCloseTime',
      'riskThresholdPercent',
    ];

    const [orderAgg, orgsWithCustom] = await Promise.all([
      models.PosOrder.findAll({
        where: orderWhere,
        attributes: [
          'organizationId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total')), 0), 'totalSum'],
        ],
        group: ['organizationId'],
        raw: true,
      }),
      models.Organization.findAll({
        where: { id: { [Op.in]: organizationIds } },
        attributes: orgAttr,
        include: [
          { model: models.Region, as: 'region', required: false, attributes: ['id', 'description'] },
          { model: models.Zone, as: 'zone', required: false, attributes: ['id', 'description'] },
          { model: models.Woreda, as: 'woreda', required: false, attributes: ['id', 'description'] },
        ],
      }),
    ]);

    const actualByOrgId = {};
    orderAgg.forEach((row) => {
      actualByOrgId[row.organizationId] = {
        orderCount: Number(row.orderCount) || 0,
        totalSum: Number(row.totalSum) || 0,
      };
    });

    function effectiveExpected(org, sec) {
      if (!sec) return null;
      return {
        dailyTxnMin: org.expectedDailyTxnMin != null ? org.expectedDailyTxnMin : sec.expectedDailyTxnMin,
        dailyTxnMax: org.expectedDailyTxnMax != null ? org.expectedDailyTxnMax : sec.expectedDailyTxnMax,
        avgTicketMin: org.expectedAvgTicketMin != null ? org.expectedAvgTicketMin : sec.expectedAvgTicketMin,
        avgTicketMax: org.expectedAvgTicketMax != null ? org.expectedAvgTicketMax : sec.expectedAvgTicketMax,
        openTime: org.expectedOpenTime != null ? org.expectedOpenTime : sec.expectedOpenTime,
        closeTime: org.expectedCloseTime != null ? org.expectedCloseTime : sec.expectedCloseTime,
        riskThresholdPercent: org.riskThresholdPercent != null ? org.riskThresholdPercent : sec.riskThresholdPercent,
      };
    }

    const orgsBySectorId = {};
    const orgResults = [];
    for (const org of orgsWithCustom) {
      if (!org.sectorId) continue;
      const sec = sectorById[org.sectorId];
      const actuals = actualByOrgId[org.id] || { orderCount: 0, totalSum: 0 };
      const actualAvgDailyTxn = actuals.orderCount / daysInPeriod;
      const actualAvgTicket = actuals.orderCount > 0 ? actuals.totalSum / actuals.orderCount : 0;
      const eff = effectiveExpected(org, sec);
      const riskPct = eff?.riskThresholdPercent != null ? Number(eff.riskThresholdPercent) : 30;

      const dailyTxnStatus = this._metricStatus(
        actualAvgDailyTxn,
        eff?.dailyTxnMin,
        eff?.dailyTxnMax,
        riskPct
      );
      const avgTicketStatus = this._metricStatus(
        actualAvgTicket,
        eff?.avgTicketMin,
        eff?.avgTicketMax,
        riskPct
      );
      const statuses = [dailyTxnStatus, avgTicketStatus].filter((s) => s !== 'n/a');
      const hasRed = statuses.includes('red');
      const hasWarning = statuses.includes('warning');
      const overall = hasRed ? 'red' : hasWarning ? 'warning' : statuses.length ? 'green' : 'n/a';

      const useCustom =
        org.expectedDailyTxnMin != null ||
        org.expectedDailyTxnMax != null ||
        org.expectedAvgTicketMin != null ||
        org.expectedAvgTicketMax != null ||
        org.expectedOpenTime != null ||
        org.expectedCloseTime != null ||
        org.riskThresholdPercent != null;

      const orgRow = {
        organizationId: org.id,
        organizationName: org.name,
        location: {
          latitude: org.latitude != null ? Number(org.latitude) : null,
          longitude: org.longitude != null ? Number(org.longitude) : null,
        },
        address: {
          country: org.country ?? null,
          regionId: org.regionId ?? null,
          regionName: org.region?.description ?? null,
          zoneId: org.zoneId ?? null,
          zoneName: org.zone?.description ?? null,
          woredaId: org.woredaId ?? null,
          woredaName: org.woreda?.description ?? null,
        },
        useCustom,
        expected: eff,
        actual: {
          orderCount: actuals.orderCount,
          totalSum: Number(actuals.totalSum.toFixed(2)),
          avgDailyTxn: Math.round(actualAvgDailyTxn * 100) / 100,
          avgTicket: Math.round(actualAvgTicket * 100) / 100,
        },
        status: { dailyTxn: dailyTxnStatus, avgTicket: avgTicketStatus, overall },
      };
      orgResults.push({ ...orgRow, sectorId: org.sectorId });
      if (!orgsBySectorId[org.sectorId]) orgsBySectorId[org.sectorId] = [];
      orgsBySectorId[org.sectorId].push(orgRow);
    }

    const result = sectors.map((sec) => {
      const orgList = orgsBySectorId[sec.id] || [];
      const sectorOrderCount = orgList.reduce((s, o) => s + o.actual.orderCount, 0);
      const sectorTotalSum = orgList.reduce((s, o) => s + o.actual.totalSum, 0);
      const sectorAvgDailyTxn = sectorOrderCount / daysInPeriod;
      const sectorAvgTicket = sectorOrderCount > 0 ? sectorTotalSum / sectorOrderCount : 0;
      const riskPct = sec.riskThresholdPercent != null ? Number(sec.riskThresholdPercent) : 30;

      const sectorDailyTxnStatus = this._metricStatus(
        sectorAvgDailyTxn,
        sec.expectedDailyTxnMin,
        sec.expectedDailyTxnMax,
        riskPct
      );
      const sectorAvgTicketStatus = this._metricStatus(
        sectorAvgTicket,
        sec.expectedAvgTicketMin,
        sec.expectedAvgTicketMax,
        riskPct
      );
      const sectorStatuses = [sectorDailyTxnStatus, sectorAvgTicketStatus].filter((s) => s !== 'n/a');
      const hasRed = sectorStatuses.includes('red');
      const hasWarning = sectorStatuses.includes('warning');
      const sectorOverall = hasRed ? 'red' : hasWarning ? 'warning' : sectorStatuses.length ? 'green' : 'n/a';
      const orgOverallRollup = orgList.length
        ? (orgList.some((o) => o.status.overall === 'red')
            ? 'red'
            : orgList.some((o) => o.status.overall === 'warning')
              ? 'warning'
              : 'green')
        : sectorOverall;

      return {
        sectorId: sec.id,
        name: sec.name,
        code: sec.code,
        division: sec.division,
        majorGroup: sec.majorGroup,
        group: sec.group,
        licensingCategory: sec.licensingCategory,
        verificationBodyId: sec.verificationBodyId ?? null,
        verificationBodyName: sec.verificationBody?.name ?? null,
        licensingAuthorityId: sec.licensingAuthorityId ?? null,
        licensingAuthorityName: sec.licensingAuthority?.name ?? null,
        expected: {
          dailyTxnMin: sec.expectedDailyTxnMin,
          dailyTxnMax: sec.expectedDailyTxnMax,
          avgTicketMin: sec.expectedAvgTicketMin,
          avgTicketMax: sec.expectedAvgTicketMax,
          openTime: sec.expectedOpenTime,
          closeTime: sec.expectedCloseTime,
          riskThresholdPercent: sec.riskThresholdPercent,
        },
        actual: {
          orderCount: sectorOrderCount,
          totalSum: Number(sectorTotalSum.toFixed(2)),
          avgDailyTxn: Math.round(sectorAvgDailyTxn * 100) / 100,
          avgTicket: Math.round(sectorAvgTicket * 100) / 100,
        },
        status: {
          dailyTxn: sectorDailyTxnStatus,
          avgTicket: sectorAvgTicketStatus,
          overall: orgOverallRollup,
        },
        organizations: orgList,
      };
    });

    return {
      dateRange: { startDate: periodStart, endDate: periodEnd },
      daysInPeriod,
      sectors: result,
    };
  }

  /**
   * Sectors performance grouped by status: On Target (green), Warning (warning), At Risk (red).
   * POST /reports/sectors-performance-by-status
   * Same body as sectors-performance: { dateRange, country?, regionId?, zoneId?, woredaId?, sectorId?, organizationIds?, verificationBodyName?, licensingAuthorityName? }
   */
  async getSectorsPerformanceByStatus(body, req) {
    const full = await this.getSectorsPerformance(body, req);
    const sectors = full.sectors || [];
    const onTarget = sectors.filter((s) => s.status?.overall === 'green' || s.status?.overall === 'n/a');
    const warning = sectors.filter((s) => s.status?.overall === 'warning');
    const atRisk = sectors.filter((s) => s.status?.overall === 'red');

    return {
      dateRange: full.dateRange,
      daysInPeriod: full.daysInPeriod,
      summary: {
        onTargetCount: onTarget.length,
        warningCount: warning.length,
        atRiskCount: atRisk.length,
        total: sectors.length,
      },
      onTarget,
      warning,
      atRisk,
    };
  }
}
