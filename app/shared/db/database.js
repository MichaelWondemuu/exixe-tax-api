import { Sequelize } from 'sequelize';
import { env } from '../../config/env.js';

export const sequelize = new Sequelize(
  env.db.database,
  env.db.username,
  env.db.password,
  {
    host: env.db.host,
    port: env.db.port,
    dialect: 'postgres',
    logging: env.db.logging ? console.log : false,
    dialectOptions: {
      ssl: env.db.ssl
        ? {
          require: true,
          rejectUnauthorized: false,
        }
        : false,
      statement_timeout: 60000,
      idle_in_transaction_session_timeout: 60000
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
  }
);

// Test connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

// Fix company_id column type conversions before sync
// Handles both directions: non-UUID -> UUID and UUID -> INTEGER

// Tables that should have company_id as INTEGER (not UUID)
const INTEGER_COMPANY_ID_TABLES = ['customers', 'stock_quants', 'stock_locations', 'stock_moves', 'stock_pickings', 'pricelists', 'product_supplier_infos'];

// Fix non-UUID -> UUID conversion
const fixCompanyIdToUuid = async () => {
  try {
    // Find all tables with company_id columns that are not UUID type
    const [tablesWithCompanyId] = await sequelize.query(
      `SELECT table_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE column_name = 'company_id'
       AND table_schema = 'public'
       AND data_type != 'uuid'
       ORDER BY table_name`
    );

    // Filter out tables that should have INTEGER
    const tablesToFix = tablesWithCompanyId.filter(
      row => !INTEGER_COMPANY_ID_TABLES.includes(row.table_name)
    );

    if (tablesToFix.length === 0) {
      return; // No tables need fixing
    }

    console.log(`Found ${tablesToFix.length} table(s) with company_id that need UUID conversion`);

    for (const row of tablesToFix) {
      const tableName = row.table_name;
      const currentType = row.data_type;
      const isNullable = row.is_nullable === 'YES';

      try {
        console.log(`Fixing ${tableName}.company_id: converting from ${currentType} to UUID...`);

        // First, drop NOT NULL constraint if it exists
        if (!isNullable) {
          await sequelize.query(
            `ALTER TABLE "${tableName}" ALTER COLUMN "company_id" DROP NOT NULL`
          );
        }

        // Drop DEFAULT if it exists
        await sequelize.query(
          `ALTER TABLE "${tableName}" ALTER COLUMN "company_id" DROP DEFAULT`
        );

        // Convert the type using USING clause
        // For integer type, we need to convert to text first, then to UUID
        // Since integers can't be meaningfully converted to UUIDs, we set them to NULL
        // For text/varchar types, we try to cast directly
        let usingClause;
        if (currentType === 'integer' || currentType === 'bigint' || currentType === 'smallint') {
          // Integer types: set to NULL since they can't be converted to UUID
          usingClause = 'NULL';
        } else {
          // Text/varchar types: try to cast, set empty strings to NULL
          usingClause = `CASE 
            WHEN "company_id" IS NULL THEN NULL
            WHEN trim("company_id"::text) = '' THEN NULL
            ELSE "company_id"::uuid 
          END`;
        }

        await sequelize.query(
          `ALTER TABLE "${tableName}" 
           ALTER COLUMN "company_id" TYPE uuid 
           USING ${usingClause}`
        );

        console.log(`Successfully converted ${tableName}.company_id from ${currentType} to UUID`);
      } catch (error) {
        // Log but don't throw - continue with other tables
        console.warn(`Warning: Could not fix ${tableName}.company_id column type:`, error.message);
      }
    }
  } catch (error) {
    // Log but don't throw - let sync attempt to handle it
    console.warn('Warning: Could not query for company_id columns:', error.message);
  }
};

// Fix UUID -> INTEGER conversion for tables that should have INTEGER
const fixCompanyIdToInteger = async () => {
  for (const tableName of INTEGER_COMPANY_ID_TABLES) {
    try {
      // Check if table exists
      const [tableExists] = await sequelize.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${tableName}')`
      );

      if (!tableExists[0].exists) {
        continue; // Table doesn't exist yet, will be created by sync
      }

      // Check if column exists and get its current type
      const [colExists] = await sequelize.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = '${tableName}' AND column_name = 'company_id'`
      );

      if (colExists.length > 0) {
        const currentType = colExists[0].data_type;
        const isNullable = colExists[0].is_nullable === 'YES';

        if (currentType === 'uuid') {
          console.log(`Fixing ${tableName}.company_id: converting from UUID to INTEGER...`);

          // First, drop NOT NULL constraint if it exists
          if (!isNullable) {
            await sequelize.query(
              `ALTER TABLE "${tableName}" ALTER COLUMN "company_id" DROP NOT NULL`
            );
          }

          // Drop DEFAULT if it exists
          await sequelize.query(
            `ALTER TABLE "${tableName}" ALTER COLUMN "company_id" DROP DEFAULT`
          );

          // Convert UUID to INTEGER - set to NULL since UUIDs can't be converted to integers
          await sequelize.query(
            `ALTER TABLE "${tableName}" 
             ALTER COLUMN "company_id" TYPE integer 
             USING NULL`
          );

          console.log(`Successfully converted ${tableName}.company_id from UUID to INTEGER`);
        }
      }
    } catch (error) {
      // Log but don't throw - continue with other tables
      console.warn(`Warning: Could not fix ${tableName}.company_id column type:`, error.message);
    }
  }
};

// Fix UUID columns that should be UUID but are currently INTEGER
// This handles columns like uom_id, category_id, etc. that should be UUID
const fixUuidColumns = async () => {
  try {
    // Common UUID foreign key columns that should be UUID (excluding company_id which is handled separately)
    // These are columns that reference UUID primary keys
    // Note: supplier_id is excluded here as it should be INTEGER in product_supplier_infos
    const uuidColumns = ['uom_id', 'category_id', 'brand_id', 'product_id', 'product_tmpl_id',
      'warehouse_id', 'location_id', 'parent_id'];

    for (const columnName of uuidColumns) {
      try {
        // Find all tables with this column that are not UUID type
        const [columns] = await sequelize.query(
          `SELECT table_name, data_type, is_nullable
           FROM information_schema.columns
           WHERE column_name = '${columnName}'
           AND table_schema = 'public'
           AND data_type != 'uuid'
           ORDER BY table_name`
        );

        if (columns.length === 0) {
          continue; // No tables need fixing for this column
        }

        console.log(`Found ${columns.length} table(s) with ${columnName} that need UUID conversion`);

        for (const row of columns) {
          const tableName = row.table_name;
          const currentType = row.data_type;
          const isNullable = row.is_nullable === 'YES';

          try {
            console.log(`Fixing ${tableName}.${columnName}: converting from ${currentType} to UUID...`);

            // First, drop NOT NULL constraint if it exists
            if (!isNullable) {
              await sequelize.query(
                `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" DROP NOT NULL`
              );
            }

            // Drop DEFAULT if it exists
            await sequelize.query(
              `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" DROP DEFAULT`
            );

            // Convert the type using USING clause
            let usingClause;
            if (currentType === 'integer' || currentType === 'bigint' || currentType === 'smallint') {
              // Integer types: set to NULL since they can't be converted to UUID
              usingClause = 'NULL';
            } else {
              // Text/varchar types: try to cast, set empty strings to NULL
              usingClause = `CASE 
                WHEN "${columnName}" IS NULL THEN NULL
                WHEN trim("${columnName}"::text) = '' THEN NULL
                ELSE "${columnName}"::uuid 
              END`;
            }

            await sequelize.query(
              `ALTER TABLE "${tableName}" 
               ALTER COLUMN "${columnName}" TYPE uuid 
               USING ${usingClause}`
            );

            // console.log(`Successfully converted ${tableName}.${columnName} from ${currentType} to UUID`);
          } catch (error) {
            // Log but don't throw - continue with other tables
            // console.warn(`Warning: Could not fix ${tableName}.${columnName} column type:`, error.message);
          }
        }
      } catch (error) {
        // Log but don't throw - continue with other columns
        // console.warn(`Warning: Could not query for ${columnName} columns:`, error.message);
      }
    }
  } catch (error) {
    // Log but don't throw - let sync attempt to handle it
    // console.warn('Warning: Could not fix UUID columns:', error.message);
  }
};

// Fix INTEGER columns that should be INTEGER but are currently UUID
// This handles columns like supplier_id in product_supplier_infos
const fixIntegerColumns = async () => {
  // Map of table.column -> should be INTEGER
  const integerColumns = [
    { table: 'product_supplier_infos', column: 'supplier_id' },
    // Add more table.column pairs here if needed
  ];

  for (const { table, column } of integerColumns) {
    try {
      // Check if table exists
      const [tableExists] = await sequelize.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}')`
      );

      if (!tableExists[0].exists) {
        continue; // Table doesn't exist yet, will be created by sync
      }

      // Check if column exists and get its current type
      const [colExists] = await sequelize.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = '${table}' AND column_name = '${column}'`
      );

      if (colExists.length > 0) {
        const currentType = colExists[0].data_type;
        const isNullable = colExists[0].is_nullable === 'YES';

        if (currentType === 'uuid') {
          // console.log(`Fixing ${table}.${column}: converting from UUID to INTEGER...`);

          // First, drop NOT NULL constraint if it exists
          if (!isNullable) {
            await sequelize.query(
              `ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP NOT NULL`
            );
          }

          // Drop DEFAULT if it exists
          await sequelize.query(
            `ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT`
          );

          // Convert UUID to INTEGER - set to NULL since UUIDs can't be converted to integers
          await sequelize.query(
            `ALTER TABLE "${table}" 
             ALTER COLUMN "${column}" TYPE integer 
             USING NULL`
          );

          // console.log(`Successfully converted ${table}.${column} from UUID to INTEGER`);
        }
      }
    } catch (error) {
      // Log but don't throw - continue with other columns
      // console.warn(`Warning: Could not fix ${table}.${column} column type:`, error.message);
    }
  }
};

// Main function to fix all company_id columns
const fixCompanyIdColumns = async () => {
  // First, fix UUID -> INTEGER for tables that should have INTEGER
  await fixCompanyIdToInteger();

  // Then, fix non-UUID -> UUID for tables that should have UUID
  await fixCompanyIdToUuid();
};

// Ensure junction tables exist before sync
// These tables are defined in associate methods and need to be created first
const ensureJunctionTables = async () => {
  try {
    // Check if UserRole exists and create it if needed
    // Note: models should already be initialized via data-source.js import in app.js
    if (sequelize.models.UserRole) {
      try {
        // First check if table exists
        const [tableExists] = await sequelize.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles')`
        );

        if (!tableExists[0].exists) {
          // Table doesn't exist, create it
          await sequelize.getQueryInterface().createTable('user_roles', {
            user_id: {
              type: sequelize.Sequelize.DataTypes.UUID,
              primaryKey: true,
              allowNull: false,
            },
            role_id: {
              type: sequelize.Sequelize.DataTypes.UUID,
              primaryKey: true,
              allowNull: false,
            },
          });
          // console.log('Created user_roles junction table');
        } else {
          // Table exists, try to sync it
          await sequelize.models.UserRole.sync({ alter: true });
        }
      } catch (error) {
        // If sync fails, log but continue
        if (!error.message.includes('already exists') && !error.message.includes('No description found')) {
          // console.warn('Could not sync user_roles table:', error.message);
        }
      }
    }

    // Check if RoleResourcePermission exists and create it if needed
    if (sequelize.models.RoleResourcePermission) {
      try {
        // First check if table exists
        const [tableExists] = await sequelize.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_resource_permissions')`
        );

        if (!tableExists[0].exists) {
          // Table doesn't exist, create it
          await sequelize.getQueryInterface().createTable('role_resource_permissions', {
            role_id: {
              type: sequelize.Sequelize.DataTypes.UUID,
              primaryKey: true,
              allowNull: false,
            },
            resource_permission_id: {
              type: sequelize.Sequelize.DataTypes.UUID,
              primaryKey: true,
              allowNull: false,
            },
          });
          // console.log('Created role_resource_permissions junction table');
        } else {
          // Table exists, try to sync it
          await sequelize.models.RoleResourcePermission.sync({ alter: true });
        }
      } catch (error) {
        // If sync fails, log but continue
        if (!error.message.includes('already exists') && !error.message.includes('No description found')) {
          // console.warn('Could not sync role_resource_permissions table:', error.message);
        }
      }
    }
  } catch (error) {
    // Log but don't throw - let sync attempt to handle it
    // console.warn('Warning: Could not ensure junction tables:', error.message);
  }
};

// Lookup tables – sync first so Organization and Sector can reference them
const LOOKUP_MODEL_NAMES = [
  'VerificationBody',
  'LicensingAuthority',
  'Region',
  'Zone',
  'Woreda',
  'Sector',
  'BusinessType',
  'Category',
  'ProductType',
  'Measurement',
  'Packaging',
];

// Sync database (only for development)
export const syncDatabase = async (options = {}) => {
  const syncOptions = {
    force: options?.force ?? false,
    alter: options?.alter ?? true,
  };
  try {
    // Ensure junction tables exist first (they're defined in associate methods)
    await ensureJunctionTables();

    // Fix column type conversions before syncing to avoid type conversion errors
    // This handles:
    // 1. UUID -> INTEGER for company_id in specific tables
    // 2. Non-UUID -> UUID for company_id in other tables
    // 3. Non-UUID -> UUID for other UUID foreign key columns (uom_id, category_id, etc.)
    // 4. UUID -> INTEGER for other INTEGER columns (supplier_id, etc.)
    await fixCompanyIdColumns();
    await fixUuidColumns();
    await fixIntegerColumns();

    // Sync lookup tables first (so lookup_sectors, lookup_verification_bodies, etc. exist before Organization)
    for (const name of LOOKUP_MODEL_NAMES) {
      const model = sequelize.models[name];
      if (model) {
        try {
          await model.sync(syncOptions);
        } catch (error) {
          console.warn(`Warning: Could not sync ${name}:`, error.message);
        }
      }
    }

    // Sync all other models except junction tables and lookup (already synced)
    const modelsToSync = Object.values(sequelize.models).filter(
      model => model.name !== 'UserRole' &&
        model.name !== 'RoleResourcePermission' &&
        model.name !== 'SisterOrganization' &&
        !LOOKUP_MODEL_NAMES.includes(model.name)
    );

    // Sync each model individually to avoid issues with junction tables
    for (const model of modelsToSync) {
      try {
        await model.sync(syncOptions);
      } catch (error) {
        // Log but continue with other models
        console.warn(`Warning: Could not sync ${model.name}:`, error.message);
      }
    }

    // Now sync junction tables separately
    if (sequelize.models.UserRole) {
      try {
        await sequelize.models.UserRole.sync(syncOptions);
      } catch (error) {
        // Ignore if table doesn't exist - it was already created
        console.warn('Warning: Could not sync UserRole:', error.message);
      }
    }

    if (sequelize.models.RoleResourcePermission) {
      try {
        await sequelize.models.RoleResourcePermission.sync(syncOptions);
      } catch (error) {
        // Ignore if table doesn't exist - it was already created
        console.warn('Warning: Could not sync RoleResourcePermission:', error.message);
      }
    }
    return true;
  } catch (error) {
    // console.error('Unable to sync database:', error);
    return false;
  }
};

