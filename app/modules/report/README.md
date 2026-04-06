# Report Module - Frontend Developer Guide

## Overview
The Report Module provides a generic reporting system that allows you to generate reports from any table in the database with flexible filtering, grouping, and date range options.

## API Endpoint

```
POST /api/v1/reports/generate
```

**Authentication Required:** Yes (JWT Bearer Token)

## Request Body Structure

```typescript
interface ReportQuery {
  // Required
  tableName: string;              // Table name to query (see TableName enum below)
  
  // Optional
  dateField?: string;              // Date field name (default: "created_at")
  showBy?: string;                // Column to group by (e.g., "category", "status")
  showingMethod?: 'RAW' | 'LINEAR'; // Display format (default: "RAW")
  showingPercent?: 'true' | 'false'; // Show percentages (default: "false")
  groupBy?: TimeInterval[];       // Time-based grouping (e.g., ["month", "year"])
  filter?: FilterCondition[];      // Filter conditions
  dateRange?: DateRange;          // Date range filter
  showUnderlevel?: OrganizationLevel; // Organization hierarchy level
}
```

## Enums and Valid Values

### TableName (Enum)
Common table names you can use:
- `"users"` - Users table
- `"items"` - Items table
- `"sales"` - Sales table
- `"purchases"` - Purchases table
- `"invoices"` - Invoices table
- `"customers"` - Customers table
- `"suppliers"` - Suppliers table
- `"orders"` - Orders table
- `"products"` - Products table
- `"transactions"` - Transactions table

**Note:** You can also use any valid table name manually. The system will query whatever table you specify.

### ShowingMethod
- `"RAW"` - Returns detailed data with all fields (default)
- `"LINEAR"` - Returns chart-ready data with labels, data, and optional percent arrays

### TimeInterval
- `"year"` - Group by year
- `"month"` - Group by month (returns month names like "January")
- `"week"` - Group by week (returns week numbers like 4)
- `"day"` - Group by day
- `"hour"` - Group by hour

### OrganizationLevel (showUnderlevel)
- `"MAIN"` - Main organization only
- `"BRANCH"` - Branch organizations
- `"SUB_BRANCH"` - Sub-branch organizations
- `"SISTER"` - Sister organizations
- `"ALL"` - All levels (MAIN + BRANCH + SUB_BRANCH) - **Only available for MAIN organization users**

### DateRange
```typescript
interface DateRange {
  range?: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 
         'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom';
  startDate?: string;  // ISO 8601 format (YYYY-MM-DD) - required if range is "custom"
  endDate?: string;    // ISO 8601 format (YYYY-MM-DD) - required if range is "custom"
}
```

### FilterCondition
```typescript
interface FilterCondition {
  field: string;        // Column name to filter
  operator: '=' | '>' | '<' | '>=' | '<=' | 'BETWEEN' | 'IN';
  value: any;          // Value(s) to compare
  value2?: any;        // Second value for BETWEEN operator
}
```

**Filter Operators:**
- `"="` - Equals
- `">"` - Greater than
- `"<"` - Less than
- `">="` - Greater than or equal
- `"<="` - Less than or equal
- `"BETWEEN"` - Between two values (value must be array: `[start, end]`)
- `"IN"` - In list of values (value must be array: `[val1, val2, ...]`)

**Filter Logic:**
- Array of conditions = AND logic between groups
- Nested arrays = OR logic within group
- Example: `[[{field: "status", operator: "=", value: "active"}, {field: "status", operator: "=", value: "pending"}], {field: "price", operator: ">", value: 100}]`
  - This means: `(status = 'active' OR status = 'pending') AND price > 100`

## Request Examples

### Example 1: Simple Report
```json
{
  "tableName": "users",
  "dateField": "created_at",
  "groupBy": ["month"],
  "showingMethod": "RAW"
}
```

### Example 2: Report with Date Range
```json
{
  "tableName": "sales",
  "dateField": "created_at",
  "dateRange": {
    "range": "thisMonth"
  },
  "groupBy": ["day"],
  "showingMethod": "LINEAR",
  "showingPercent": "true"
}
```

### Example 3: Report with Custom Date Range
```json
{
  "tableName": "orders",
  "dateField": "order_date",
  "dateRange": {
    "range": "custom",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "groupBy": ["month", "year"],
  "showingMethod": "RAW"
}
```

### Example 4: Report with Filters
```json
{
  "tableName": "products",
  "dateField": "created_at",
  "filter": [
    [
      { "field": "status", "operator": "=", "value": "active" },
      { "field": "status", "operator": "=", "value": "pending" }
    ],
    { "field": "price", "operator": ">", "value": 100 },
    { "field": "category", "operator": "IN", "value": ["electronics", "clothing"] }
  ],
  "groupBy": ["month"],
  "showingMethod": "RAW"
}
```

### Example 5: Report Grouped by Custom Column
```json
{
  "tableName": "sales",
  "dateField": "created_at",
  "showBy": "category",
  "groupBy": ["month"],
  "showingMethod": "LINEAR",
  "showingPercent": "true"
}
```

### Example 6: Report with Organization Hierarchy
```json
{
  "tableName": "users",
  "dateField": "created_at",
  "showUnderlevel": "BRANCH",
  "groupBy": ["month"],
  "showingMethod": "RAW"
}
```

### Example 7: Report with ALL Organization Levels
```json
{
  "tableName": "sales",
  "dateField": "created_at",
  "showUnderlevel": "ALL",
  "groupBy": ["month"],
  "showingMethod": "RAW"
}
```

### Example 8: Complex Report with All Features
```json
{
  "tableName": "orders",
  "dateField": "order_date",
  "dateRange": {
    "range": "thisYear"
  },
  "showBy": "status",
  "showUnderlevel": "ALL",
  "groupBy": ["month", "week"],
  "filter": [
    { "field": "total_amount", "operator": ">", "value": 500 }
  ],
  "showingMethod": "LINEAR",
  "showingPercent": "true"
}
```

## Response Format

### RAW Mode Response
```json
[
  {
    "month": "January",
    "year": 2024,
    "organization_name": "Main Office",
    "organization_level": "MAIN",
    "groupedBy": "electronics",
    "count": 150,
    "percent": "25.5%"
  },
  {
    "month": "February",
    "year": 2024,
    "organization_name": "Branch Office 1",
    "organization_level": "BRANCH",
    "groupedBy": "clothing",
    "count": 200,
    "percent": "34.0%"
  }
]
```

### LINEAR Mode Response
```json
{
  "labels": ["January", "February", "March"],
  "data": [150, 200, 175],
  "percent": ["25.5%", "34.0%", "29.8%"]
}
```

**Note:** When `showingPercent` is `"false"`, the `percent` field is omitted.

## Response Fields

### Common Fields
- `count` - Number of records (always present)
- `percent` - Percentage as string (e.g., "25.5%") - only if `showingPercent: "true"`

### Time Grouping Fields
- `year` - Year number (if grouped by year)
- `month` - Month name (e.g., "January") (if grouped by month)
- `week` - Week number (e.g., 4) (if grouped by week)
- `day` - Day timestamp (if grouped by day)
- `hour` - Hour timestamp (if grouped by hour)

### Organization Fields (when showUnderlevel is used)
- `organization_name` - Name of the organization
- `organization_level` - Organization type: "MAIN", "BRANCH", "SUB_BRANCH", or "SISTER"

### Custom Grouping Field
- `groupedBy` - Value of the column specified in `showBy`

## Error Responses

### 400 Bad Request - Validation Error
```json
{
  "error": {
    "message": "Request body validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "issues": [
        {
          "path": "tableName",
          "rule": "required",
          "message": "Table name is required and must be a string"
        }
      ]
    }
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "message": "Organization ID is required",
    "code": "UNAUTHORIZED"
  }
}
```

### 403 Forbidden - Access Denied
```json
{
  "error": {
    "message": "Your organization type (BRANCH) does not have permission to view data at MAIN level. Allowed levels: BRANCH, SUB_BRANCH",
    "code": "ACCESS_DENIED"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "message": "Failed to generate report: [error details]",
    "code": "REPORT_GENERATION_FAILED"
  }
}
```

## Access Control Rules

### showUnderlevel Access Matrix

| User's Org Type | MAIN | BRANCH | SUB_BRANCH | SISTER | ALL |
|----------------|------|--------|------------|--------|-----|
| MAIN           | ✅   | ✅     | ✅         | ✅     | ✅  |
| BRANCH         | ❌   | ✅     | ✅         | ❌     | ❌  |
| SUB_BRANCH     | ❌   | ❌     | ✅         | ❌     | ❌  |
| SISTER         | ❌   | ❌     | ✅         | ✅     | ❌  |

## Best Practices

1. **Always specify `dateField`** if your table uses a different date column than `created_at`
2. **Use `dateRange`** to limit data scope and improve performance
3. **Use `groupBy`** for time-based analysis (month, week, etc.)
4. **Use `showBy`** to group by categorical data (category, status, etc.)
5. **Use `LINEAR` mode** for charts and visualizations
6. **Use `RAW` mode** for detailed data tables
7. **Include `showUnderlevel`** when you need organization-level breakdowns
8. **Test with small date ranges first** before querying large datasets

## TypeScript Types

```typescript
// Complete type definitions
type TableName = 
  | 'users' 
  | 'items' 
  | 'sales' 
  | 'purchases' 
  | 'invoices' 
  | 'customers' 
  | 'suppliers' 
  | 'orders' 
  | 'products' 
  | 'transactions'
  | string; // Can also be any valid table name

type ShowingMethod = 'RAW' | 'LINEAR';
type TimeInterval = 'year' | 'month' | 'week' | 'day' | 'hour';
type OrganizationLevel = 'MAIN' | 'BRANCH' | 'SUB_BRANCH' | 'SISTER' | 'ALL';
type FilterOperator = '=' | '>' | '<' | '>=' | '<=' | 'BETWEEN' | 'IN';
type DateRangeType = 
  | 'today' 
  | 'yesterday' 
  | 'thisWeek' 
  | 'lastWeek' 
  | 'thisMonth' 
  | 'lastMonth' 
  | 'thisYear' 
  | 'lastYear' 
  | 'custom';

interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
  value2?: any;
}

interface DateRange {
  range?: DateRangeType;
  startDate?: string; // ISO 8601: YYYY-MM-DD
  endDate?: string;   // ISO 8601: YYYY-MM-DD
}

interface ReportQuery {
  tableName: TableName;
  dateField?: string;
  showBy?: string;
  showingMethod?: ShowingMethod;
  showingPercent?: 'true' | 'false';
  groupBy?: TimeInterval[];
  filter?: (FilterCondition | FilterCondition[])[];
  dateRange?: DateRange;
  showUnderlevel?: OrganizationLevel;
}

interface RawReportItem {
  count: number;
  percent?: string;
  year?: number;
  month?: string;
  week?: number;
  day?: string;
  hour?: string;
  organization_name?: string;
  organization_level?: string;
  groupedBy?: any;
  [key: string]: any;
}

interface LinearReportResponse {
  labels: string[];
  data: number[];
  percent?: string[];
}

type ReportResponse = RawReportItem[] | LinearReportResponse;
```

## Notes

- All date fields should be in ISO 8601 format (YYYY-MM-DD)
- Week numbers are returned as integers (1-52)
- Month names are returned as full names (e.g., "January", "February")
- Organization info (name and level) is automatically included when `showUnderlevel` is specified
- The `tableName` can be any valid table name in the database, not just the enum values
- All string values are case-insensitive and will be converted to uppercase where applicable
- Filter conditions support complex AND/OR logic through nested arrays
