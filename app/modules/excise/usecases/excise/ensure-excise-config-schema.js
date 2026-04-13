import { sequelize } from '../../../../shared/db/database.js';
import { randomUUID } from 'crypto';

let configSchemaReadyPromise = null;

export const EXCISE_CONFIG_KEYS = Object.freeze({
  STAMP_REQUEST_MIN_LEAD_TIME: 'STAMP_REQUEST_MIN_LEAD_TIME',
  STAMP_REQUEST_MIN_LEAD_DAYS: 'STAMP_REQUEST_MIN_LEAD_DAYS',
  TAX_AUTHORITY_REVIEW_SLA_WORKING_DAYS: 'TAX_AUTHORITY_REVIEW_SLA_WORKING_DAYS',
  ELIGIBLE_EXCISE_CATEGORY_CODES: 'ELIGIBLE_EXCISE_CATEGORY_CODES',
  ELIGIBLE_EXCISE_PRODUCT_TYPES: 'ELIGIBLE_EXCISE_PRODUCT_TYPES',
  STAMP_LABEL_DIGITAL_LINK_BASE_URL: 'STAMP_LABEL_DIGITAL_LINK_BASE_URL',
});

export const EXCISE_DEFAULT_CONFIGS = Object.freeze({
  [EXCISE_CONFIG_KEYS.STAMP_REQUEST_MIN_LEAD_TIME]: {
    value: 60,
    description:
      'Minimum lead time in days for stamp requests and forecasts (preferred key)',
  },
  [EXCISE_CONFIG_KEYS.STAMP_REQUEST_MIN_LEAD_DAYS]: {
    value: 60,
    description:
      'Minimum lead time in days for stamp requests and forecasts (legacy alias)',
  },
  [EXCISE_CONFIG_KEYS.TAX_AUTHORITY_REVIEW_SLA_WORKING_DAYS]: {
    value: 5,
    description: 'Tax authority review SLA in working days',
  },
  [EXCISE_CONFIG_KEYS.ELIGIBLE_EXCISE_CATEGORY_CODES]: {
    value: [
      'EXC_ALCOHOLIC_BEVERAGES',
      'EXC_TOBACCO_PRODUCTS',
      'EXC_NON_ALCOHOLIC_BEVERAGES',
    ],
    description: 'Allowed product category codes for excise stamp requests',
  },
  [EXCISE_CONFIG_KEYS.ELIGIBLE_EXCISE_PRODUCT_TYPES]: {
    value: ['LUXURY', 'PREMIUM', 'STANDARD'],
    description: 'Allowed product type names for excise stamp requests',
  },
  [EXCISE_CONFIG_KEYS.STAMP_LABEL_DIGITAL_LINK_BASE_URL]: {
    value: 'https://stamp.cheche.et/verify',
    description: 'Base URL used to build stamp label digital links',
  },
});

export async function ensureExciseConfigSchema() {
  if (configSchemaReadyPromise) {
    return configSchemaReadyPromise;
  }

  configSchemaReadyPromise = (async () => {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "excise_configs" (
        "id" UUID PRIMARY KEY,
        "organization_id" UUID,
        "organization_name" VARCHAR(255),
        "key" VARCHAR(128) NOT NULL UNIQUE,
        "value" JSONB NOT NULL,
        "description" VARCHAR(500),
        "is_editable" BOOLEAN NOT NULL DEFAULT TRUE,
        "created_by" UUID,
        "updated_by" UUID,
        "deleted_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await sequelize.query(`
      ALTER TABLE "excise_configs"
      ADD COLUMN IF NOT EXISTS "organization_name" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ
    `);

    for (const [key, def] of Object.entries(EXCISE_DEFAULT_CONFIGS)) {
      await sequelize.query(
        `
          INSERT INTO "excise_configs" ("id", "key", "value", "description", "is_editable", "created_at", "updated_at")
          VALUES (:id, :key, :value::jsonb, :description, TRUE, NOW(), NOW())
          ON CONFLICT ("key") DO NOTHING
        `,
        {
          replacements: {
            id: randomUUID(),
            key,
            value: JSON.stringify(def.value),
            description: def.description,
          },
        },
      );
    }
  })().catch((error) => {
    configSchemaReadyPromise = null;
    throw error;
  });

  return configSchemaReadyPromise;
}
