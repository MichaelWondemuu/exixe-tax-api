import * as yup from 'yup';

const DATE_RANGE_KEYS = [
  'today',
  'yesterday',
  'thisWeek',
  'lastWeek',
  'thisMonth',
  'lastMonth',
  'thisYear',
  'lastYear',
  'thisQuarter',
  'lastQuarter',
  'this6month',
  'last6month',
  'custom',
];

const GROUP_INTERVALS = ['year', 'month', 'week', 'day', 'hour'];
const SHOW_UNDER = ['MAIN', 'BRANCH', 'SUB_BRANCH', 'SISTER', 'ALL'];

const filterConditionSchema = yup
  .object({
    field: yup.string().trim().required(),
    operator: yup.string().trim().required(),
    value: yup.mixed().defined(),
    value2: yup.mixed().optional(),
  })
  .test('between-value', 'BETWEEN operator requires array with 2 values', (v) => {
    if (!v || v.operator !== 'BETWEEN') return true;
    return Array.isArray(v.value) && v.value.length === 2;
  })
  .test('in-value', 'IN operator requires array of values', (v) => {
    if (!v || v.operator !== 'IN') return true;
    return Array.isArray(v.value);
  });

const filterEntrySchema = yup.lazy((value) => {
  if (Array.isArray(value)) {
    return yup.array().of(filterConditionSchema).min(1);
  }
  if (value && typeof value === 'object') {
    return filterConditionSchema;
  }
  return yup.mixed().test('filter-shape', 'Invalid filter entry', () => false);
});

export const dateRangeShape = yup
  .object({
    range: yup.string().trim().required(),
    startDate: yup.string().trim().optional(),
    endDate: yup.string().trim().optional(),
  })
  .test('range-enum', function (v) {
    if (!v?.range) return true;
    if (!DATE_RANGE_KEYS.includes(v.range)) {
      return this.createError({
        path: 'range',
        message: `Invalid range. Valid values are: ${DATE_RANGE_KEYS.join(', ')}`,
      });
    }
    return true;
  })
  .test('custom-dates', function (v) {
    if (!v || v.range !== 'custom') return true;
    if (!v.startDate) {
      return this.createError({
        path: 'startDate',
        message: 'startDate is required when range is "custom"',
      });
    }
    if (!v.endDate) {
      return this.createError({
        path: 'endDate',
        message: 'endDate is required when range is "custom"',
      });
    }
    return true;
  })
  .test('start-parse', function (v) {
    if (!v?.startDate) return true;
    const d = new Date(v.startDate);
    if (Number.isNaN(d.getTime())) {
      return this.createError({
        path: 'startDate',
        message: 'startDate must be a valid date string (ISO 8601 format)',
      });
    }
    return true;
  })
  .test('end-parse', function (v) {
    if (!v?.endDate) return true;
    const d = new Date(v.endDate);
    if (Number.isNaN(d.getTime())) {
      return this.createError({
        path: 'endDate',
        message: 'endDate must be a valid date string (ISO 8601 format)',
      });
    }
    return true;
  })
  .test('order', function (v) {
    if (!v?.startDate || !v?.endDate) return true;
    const start = new Date(v.startDate);
    const end = new Date(v.endDate);
    if (start > end) {
      return this.createError({
        path: 'endDate',
        message: 'endDate must be after or equal to startDate',
      });
    }
    return true;
  });

/** Avoid Yup turning a missing optional `dateRange` into `{}` (which would fail `range` required). */
function optionalDateRangeField() {
  return yup
    .mixed()
    .optional()
    .test('dateRange-shape', function (v) {
      if (v === undefined || v === null) return true;
      if (typeof v !== 'object' || Array.isArray(v)) {
        return this.createError({ message: 'dateRange must be an object' });
      }
      try {
        dateRangeShape.validateSync(v, { abortEarly: false });
        return true;
      } catch (e) {
        const msg = e?.errors?.[0] ?? e?.message ?? 'Invalid dateRange';
        return this.createError({ message: msg });
      }
    });
}

/** POST /reports/generate */
export const reportQuerySchema = yup
  .object({
    showBy: yup.string().trim().optional(),
    tableName: yup.string().trim().required('Table name is required and must be a string'),
    dateField: yup.string().trim().default('created_at'),
    showingMethod: yup
      .string()
      .oneOf(['RAW', 'LINEAR'], 'showingMethod must be RAW or LINEAR')
      .default('RAW'),
    showingPercent: yup
      .mixed()
      .transform((v) => {
        if (v === true || v === 'true') return 'true';
        if (v === false || v === 'false') return 'false';
        return v != null ? String(v) : 'false';
      })
      .oneOf(['true', 'false'], 'showingPercent must be "true" or "false"')
      .default('false'),
    groupBy: yup
      .mixed()
      .transform((v) => {
        if (v == null || v === '') return undefined;
        if (Array.isArray(v)) return v;
        if (typeof v === 'string') return v.split(',').map((g) => g.trim()).filter(Boolean);
        return [String(v)];
      })
      .optional(),
    filter: yup.array().of(filterEntrySchema).optional(),
    dateRange: optionalDateRangeField(),
    showUnderlevel: yup
      .string()
      .trim()
      .transform((s) => (s ? s.toUpperCase() : s))
      .oneOf(SHOW_UNDER, `showUnderlevel must be one of: ${SHOW_UNDER.join(', ')}`)
      .optional(),
  })
  .test('groupBy-intervals', function (v) {
    if (!v?.groupBy) return true;
    if (!Array.isArray(v.groupBy)) {
      return this.createError({
        path: 'groupBy',
        message: 'groupBy must be an array',
      });
    }
    const bad = v.groupBy.filter((g) => !GROUP_INTERVALS.includes(g));
    if (bad.length) {
      return this.createError({
        path: 'groupBy',
        message: `Invalid time intervals: ${bad.join(', ')}`,
      });
    }
    return true;
  });

function optionalGeoFields() {
  return {
    country: yup.string().trim().optional(),
    regionId: yup.number().optional().nullable(),
    zoneId: yup.number().optional().nullable(),
    woredaId: yup.number().optional().nullable(),
    sectorId: yup.mixed().optional().nullable(),
    sectorIds: yup
      .array()
      .of(yup.mixed())
      .optional()
      .transform((arr) =>
        Array.isArray(arr) ? arr.filter((id) => id != null && String(id).trim() !== '') : arr,
      ),
    organizationIds: yup
      .array()
      .of(yup.mixed())
      .optional()
      .transform((arr) =>
        Array.isArray(arr) ? arr.filter((id) => id != null && String(id).trim() !== '') : arr,
      ),
    taxType: yup.string().trim().optional(),
    taxName: yup.string().trim().optional(),
    dateRange: optionalDateRangeField(),
  };
}

/** POST /reports/pos-order-invoice-by-geography */
export const posOrderInvoiceGeographySchema = yup
  .object({
    country: yup.string().trim().required('country is required'),
    regionId: yup.number().optional().nullable(),
    zoneId: yup.number().optional().nullable(),
    woredaId: yup.number().optional().nullable(),
    compareWithPrevious: yup
      .mixed()
      .transform((v) => v === true || v === 'true')
      .optional()
      .default(false),
    taxType: yup.string().trim().optional(),
    taxName: yup.string().trim().optional(),
    sectorId: yup.mixed().optional().nullable(),
    sectorIds: yup
      .array()
      .of(yup.mixed())
      .optional()
      .transform((arr) =>
        Array.isArray(arr) ? arr.filter((id) => id != null && String(id).trim() !== '') : arr,
      ),
    organizationIds: yup
      .array()
      .of(yup.mixed())
      .optional()
      .transform((arr) =>
        Array.isArray(arr) ? arr.filter((id) => id != null && String(id).trim() !== '') : arr,
      ),
    dateRange: dateRangeShape.required('dateRange is required'),
  });

/** POST /reports/analytics/dashboard-summary */
export const posDashboardSummarySchema = yup.object(optionalGeoFields());

/** POST /reports/sectors-performance and /sectors-performance-by-status */
export const sectorsPerformanceSchema = yup.object({
  ...optionalGeoFields(),
  dateRange: dateRangeShape.required('dateRange is required'),
  verificationBodyName: yup.string().trim().optional(),
  licensingAuthorityName: yup.string().trim().optional(),
});
