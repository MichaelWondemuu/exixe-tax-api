import { HttpError } from '../../../shared/utils/http-error.js';

/**
 * Date Range Service
 * Handles predefined date ranges and custom date ranges
 */
export class DateRangeService {
  /**
   * Get date range based on predefined range or custom dates
   * @param {string} range - Predefined range (today, yesterday, thisWeek, lastWeek, thisMonth, thisYear) or 'custom'
   * @param {string} startDate - Custom start date (ISO 8601 format) - required if range is 'custom'
   * @param {string} endDate - Custom end date (ISO 8601 format) - required if range is 'custom'
   * @returns {Object} { startDate: Date, endDate: Date }
   */
  getDateRange(range, startDate, endDate) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let start, end;

    switch (range) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        end.setHours(23, 59, 59, 999);
        break;

      case 'yesterday':
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;

      case 'thisWeek':
        // Start of week (Monday)
        start = new Date(today);
        const dayOfWeek = start.getDay();
        const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        // End of week (Sunday)
        end = new Date(today);
        end.setHours(23, 59, 59, 999);
        break;

      case 'lastWeek':
        // Start of last week (Monday)
        start = new Date(today);
        const lastWeekDayOfWeek = start.getDay();
        const lastWeekDiff = start.getDate() - lastWeekDayOfWeek + (lastWeekDayOfWeek === 0 ? -6 : 1) - 7;
        start.setDate(lastWeekDiff);
        start.setHours(0, 0, 0, 0);
        // End of last week (Sunday)
        end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;

      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;

      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(today.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;

      case 'lastYear':
        start = new Date(today.getFullYear() - 1, 0, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(today.getFullYear() - 1, 11, 31);
        end.setHours(23, 59, 59, 999);
        break;

      case 'thisQuarter': {
        const q = Math.floor(today.getMonth() / 3) + 1;
        start = new Date(today.getFullYear(), (q - 1) * 3, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(today.getFullYear(), q * 3, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }

      case 'lastQuarter': {
        const q = Math.floor(today.getMonth() / 3) + 1;
        const lastQ = q === 1 ? 4 : q - 1;
        const y = q === 1 ? today.getFullYear() - 1 : today.getFullYear();
        start = new Date(y, (lastQ - 1) * 3, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(y, lastQ * 3, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }

      case 'this6month': {
        const m = today.getMonth();
        const startMonth = m < 6 ? 0 : 6;
        start = new Date(today.getFullYear(), startMonth, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(today.getFullYear(), startMonth + 6, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }

      case 'last6month': {
        const m = today.getMonth();
        if (m < 6) {
          start = new Date(today.getFullYear() - 1, 6, 1);
          end = new Date(today.getFullYear() - 1, 11, 31);
        } else {
          start = new Date(today.getFullYear(), 0, 1);
          end = new Date(today.getFullYear(), 5, 30);
        }
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }

      case 'custom':
        if (!startDate || !endDate) {
          throw new HttpError(
            400,
            'INVALID_DATE_RANGE',
            'startDate and endDate are required when range is "custom"'
          );
        }
        start = new Date(startDate);
        end = new Date(endDate);
        
        // Validate dates
        if (isNaN(start.getTime())) {
          throw new HttpError(
            400,
            'INVALID_DATE_RANGE',
            'Invalid startDate format. Use ISO 8601 format (YYYY-MM-DD)'
          );
        }
        if (isNaN(end.getTime())) {
          throw new HttpError(
            400,
            'INVALID_DATE_RANGE',
            'Invalid endDate format. Use ISO 8601 format (YYYY-MM-DD)'
          );
        }
        
        // Set time boundaries
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        // Validate range
        if (start > end) {
          throw new HttpError(
            400,
            'INVALID_DATE_RANGE',
            'startDate must be before or equal to endDate'
          );
        }
        break;

      default:
        throw new HttpError(
          400,
          'INVALID_DATE_RANGE',
          `Invalid date range: ${range}. Valid values are: today, yesterday, thisWeek, lastWeek, thisMonth, lastMonth, thisYear, lastYear, thisQuarter, lastQuarter, this6month, last6month, custom`
        );
    }

    return {
      startDate: start,
      endDate: end,
    };
  }

  /**
   * Format date for SQL query (PostgreSQL format)
   * @param {Date} date - Date object
   * @returns {string} Formatted date string (YYYY-MM-DD HH:mm:ss)
   */
  formatDateForSQL(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Build date filter condition for SQL WHERE clause
   * @param {string} dateField - Date field name in the database
   * @param {string} range - Predefined range or 'custom'
   * @param {string} startDate - Custom start date (optional)
   * @param {string} endDate - Custom end date (optional)
   * @param {string} tableName - Table name for column reference (optional)
   * @returns {string} SQL condition string
   */
  buildDateFilter(dateField, range, startDate, endDate, tableName) {
    if (!range) {
      return '';
    }

    const { startDate: start, endDate: end } = this.getDateRange(
      range,
      startDate,
      endDate
    );

    // Ensure dateField is properly quoted for PostgreSQL
    const cleanDateField = dateField.replace(/"/g, '');
    const columnRef = tableName
      ? `${tableName}."${cleanDateField}"`
      : `"${cleanDateField}"`;

    const startStr = this.formatDateForSQL(start);
    const endStr = this.formatDateForSQL(end);

    return `${columnRef} >= '${startStr}' AND ${columnRef} <= '${endStr}'`;
  }
}
