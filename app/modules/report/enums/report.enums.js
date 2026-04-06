/**
 * Filter Operators Enum
 */
export const FilterOperators = Object.freeze({
  EQUAL: '=',
  GREATER_THAN: '>',
  LESS_THAN: '<',
  GREATER_THAN_OR_EQUAL: '>=',
  LESS_THAN_OR_EQUAL: '<=',
  BETWEEN: 'BETWEEN',
  IN: 'IN',
});

/**
 * Report View Type Enum
 */
export const ReportViewTypeEnum = Object.freeze({
  RAW: 'RAW',
  LINEAR: 'LINEAR',
});

/**
 * Time Interval Enum
 */
export const TimeInterval = Object.freeze({
  YEAR: 'year',
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
  HOUR: 'hour',
});
