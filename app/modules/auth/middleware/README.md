# Scope-Aware RBAC Middleware

This directory contains the enterprise-grade scope-aware role-based access control (RBAC) system for the POS API.

## Overview

The system provides:
- **Authorization**: Determines WHAT actions are allowed (via middleware)
- **Data Filtering**: Determines WHERE data can be accessed (via repositories)
- **Scope Resolution**: Automatically resolves the highest applicable scope (SYSTEM > ORGANIZATION > BRANCH)

## Architecture

```
┌─────────────────┐
│   Middleware    │  → Authorization: "Can user perform this action?"
│  (Permission)   │     Determines: WHAT actions are allowed
└─────────────────┘
         │
         │ Injects scope info into context
         ▼
┌─────────────────┐
│   Controller    │  → Business Logic: "What should happen?"
│  (Handler)      │     No RBAC logic, no filtering logic
└─────────────────┘
         │
         │ Passes context to repository
         ▼
┌─────────────────┐
│   Repository    │  → Data Access: "Where can data be accessed?"
│  (Data Layer)   │     Determines: WHERE data can be accessed
└─────────────────┘
```

## Core Components

### 1. Authentication Middleware (`auth.middleware.js`)

Validates JWT tokens and extracts user information from:
- JWT Bearer token
- `x-api-key` header (for service-to-service)
- `x-user-key` header (for user ID override)
- `x-user-roles` header (for role override)
- `x-organization-id` header (for organization override)
- `x-branch-id` header (for branch override)

**Usage:**
```javascript
import { authMiddleware } from './modules/auth/middleware/index.js';

router.use(authMiddleware());
```

### 2. Scope-Aware Permission Middleware (`scope-aware-permission.middleware.js`)

Checks permissions and resolves scope. Two variants:

**Single Permission:**
```javascript
import { scopeAwarePermission } from './modules/auth/middleware/index.js';

router.get('/items',
  authMiddleware(),
  scopeAwarePermission('item:list'),
  handler.listItems,
);
```

**Multiple Permissions (OR logic):**
```javascript
import { scopeAwarePermissions } from './modules/auth/middleware/index.js';

router.get('/items',
  authMiddleware(),
  scopeAwarePermissions('item:list', 'item:read'),
  handler.listItems,
);
```

### 3. Scope Resolution (`scope-resolution.js`)

Determines the highest applicable scope for a permission:
- **SYSTEM**: Global access (no filters)
- **ORGANIZATION**: Filter by `organization_id`
- **BRANCH**: Filter by `organization_id` + `branch_id`

**Business Rules:**
- If ANY role grants the permission, access is allowed
- When multiple roles grant the permission, the WIDEST scope wins
- Scope resolution: SYSTEM > ORGANIZATION > BRANCH

### 4. Scope Filtering (`scope-filtering.js`)

Automatically applies scope-based filters to Sequelize queries:
- SYSTEM scope: No filters
- ORGANIZATION scope: `WHERE organization_id = ?`
- BRANCH scope: `WHERE organization_id = ? AND (branch_id = ? OR branch_id IS NULL)`

## Usage Examples

### Basic Route Protection

```javascript
import { authMiddleware, scopeAwarePermission } from './modules/auth/middleware/index.js';

// Protect a route with permission check
router.get('/sales',
  authMiddleware(),
  scopeAwarePermission('sale:list'),
  async (req, res) => {
    // User is authenticated and has permission
    // Scope is automatically resolved and injected into req
    const sales = await salesRepository.findAll(req, {}, queryParams);
    res.json(sales);
  }
);
```

### Repository Usage

The base repository automatically applies scope filters:

```javascript
// In your service
class SalesService {
  async listSales(req, queryParams) {
    // findAll automatically applies scope filters based on req context
    return this.salesRepository.findAll(req, {}, queryParams);
  }

  async getSale(req, id) {
    // findById automatically applies scope filters
    return this.salesRepository.findById(req, id);
  }

  async createSale(req, data) {
    // create automatically injects user context (createdBy, organizationId, etc.)
    return this.salesRepository.create(req, data);
  }
}
```

### Permission Format

Permissions follow the format: `"resource:action"`

Examples:
- `item:list` - List items
- `item:create` - Create items
- `item:update` - Update items
- `item:delete` - Delete items
- `sale:list` - List sales
- `sale:create` - Create sales
- `warehouse:read` - Read warehouse

## Context Keys

The middleware injects scope information into the request object:

```javascript
req[ContextKeys.SCOPE_INFO]        // Complete scope info object
req[ContextKeys.RESOLVED_SCOPE]    // Scope enum value
req[ContextKeys.USER_ID]           // User ID
req[ContextKeys.ORGANIZATION_ID]    // Organization ID
req[ContextKeys.BRANCH_ID]          // Branch ID
req[ContextKeys.IS_SYSTEM]          // Is system user
req[ContextKeys.IS_ORGANIZATION_BASED] // Is organization-based user
```

## Error Handling

Authorization errors return structured responses:

```json
{
  "error": "User does not have required permission: item:list",
  "code": "PERMISSION_DENIED",
  "details": {
    "user_id": "uuid",
    "required_permission": "item:list",
    "resolved_scope": "ORGANIZATION"
  }
}
```

## Initialization

The auth module automatically initializes the role loader:

```javascript
// In auth.module.js
import { setRoleLoader } from './middleware/scope-aware-permission.middleware.js';
import { RoleService } from './service/role.service.js';

const roleService = new RoleService({ roleRepository });

// Set up role loader for scope-aware permission middleware
setRoleLoader(async (userId) => {
  return roleService.loadUserRolesWithPermissions(userId);
});
```

## Best Practices

1. **Always use `authMiddleware()` before `scopeAwarePermission()`**
2. **Keep controllers clean** - No RBAC logic in controllers
3. **Let repositories handle filtering** - Don't manually filter in services
4. **Use consistent permission naming** - Follow `resource:action` format
5. **Test scope resolution** - Verify SYSTEM > ORGANIZATION > BRANCH priority

## Migration Guide

### From Legacy System

1. **Add middleware to routes:**
   ```javascript
   // Before
   router.get('/items', handler.listItems);
   
   // After
   router.get('/items',
     authMiddleware(),
     scopeAwarePermission('item:list'),
     handler.listItems,
   );
   ```

2. **Update repository calls:**
   ```javascript
   // Before
   findAll(options, queryParams)
   
   // After
   findAll(req, options, queryParams)
   ```

3. **Remove manual filtering:**
   ```javascript
   // Before
   const items = await Item.findAll({
     where: { organizationId: user.organizationId }
   });
   
   // After
   const items = await itemRepository.findAll(req, {}, queryParams);
   ```

## Security Considerations

1. **Permission Format Validation**: Permissions must follow "resource:action" format
2. **Scope Injection**: Scope info is injected by middleware (not user-modifiable)
3. **Defense in Depth**: JWT check (fast path) + Database role verification (slow path)
4. **Automatic Filtering**: Repositories automatically apply scope filters

## Performance

- **Fast Path**: < 1ms (JWT permission check only)
- **Slow Path**: ~5-10ms (includes role loading)
- **Database Query**: ~2-5ms (role loading with preloads)

Most unauthorized requests are rejected immediately via fast path.

