import { sequelize } from '../../../../shared/db/database.js';

let stampLabelSchemaReadyPromise = null;

export async function ensureStampLabelSchema() {
  if (stampLabelSchemaReadyPromise) {
    return stampLabelSchemaReadyPromise;
  }

  stampLabelSchemaReadyPromise = (async () => {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "stamp_labels" (
        "id" UUID PRIMARY KEY,
        "organization_id" UUID,
        "stamp_request_id" UUID NOT NULL,
        "stamp_request_number" VARCHAR(64) NOT NULL,
        "template_id" UUID,
        "template_code" VARCHAR(128),
        "template_version" VARCHAR(32),
        "template_lifecycle_status" VARCHAR(32),
        "template_resolved_by" VARCHAR(32),
        "template_qr_enabled" BOOLEAN,
        "template_serial_pattern" VARCHAR(255),
        "template_security_features" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "template_label_structure" TEXT,
        "stamp_uid" VARCHAR(128) NOT NULL UNIQUE,
        "digital_link" VARCHAR(512),
        "code_format" VARCHAR(32) NOT NULL DEFAULT 'GS1_DATAMATRIX',
        "status" VARCHAR(32) NOT NULL DEFAULT 'GENERATED',
        "operator_type" VARCHAR(32) NOT NULL,
        "operator_name" VARCHAR(255) NOT NULL,
        "operator_tin" VARCHAR(64) NOT NULL,
        "operator_license_number" VARCHAR(128),
        "merchant_id" VARCHAR(128),
        "merchant_name" VARCHAR(255),
        "ethiopia_revenue_office" VARCHAR(255),
        "product_id" UUID,
        "product_name" VARCHAR(255),
        "package_level" VARCHAR(32) NOT NULL DEFAULT 'UNIT',
        "batch_number" VARCHAR(128),
        "batch_id" UUID,
        "production_date" TIMESTAMPTZ,
        "forecast_reference" VARCHAR(128),
        "forecast_submitted_at" TIMESTAMPTZ,
        "requires_sixty_day_forecast" BOOLEAN NOT NULL DEFAULT TRUE,
        "is_imported" BOOLEAN NOT NULL DEFAULT FALSE,
        "customs_declaration_number" VARCHAR(128),
        "generated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "issued_at" TIMESTAMPTZ,
        "assigned_at" TIMESTAMPTZ,
        "applied_at" TIMESTAMPTZ,
        "activated_at" TIMESTAMPTZ,
        "tracked_at" TIMESTAMPTZ,
        "verified_at" TIMESTAMPTZ,
        "audited_at" TIMESTAMPTZ,
        "revoked_at" TIMESTAMPTZ,
        "assigned_to_operator_id" VARCHAR(128),
        "application_line_code" VARCHAR(128),
        "activation_location_code" VARCHAR(128),
        "last_known_location_code" VARCHAR(128),
        "last_verification_result" VARCHAR(32),
        "enforcement_state" VARCHAR(32),
        "notes" TEXT,
        "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await sequelize.query(`
      ALTER TABLE "stamp_labels"
      ADD COLUMN IF NOT EXISTS "stamp_request_id" UUID,
      ADD COLUMN IF NOT EXISTS "stamp_request_number" VARCHAR(64),
      ADD COLUMN IF NOT EXISTS "template_id" UUID,
      ADD COLUMN IF NOT EXISTS "template_code" VARCHAR(128),
      ADD COLUMN IF NOT EXISTS "template_version" VARCHAR(32),
      ADD COLUMN IF NOT EXISTS "template_lifecycle_status" VARCHAR(32),
      ADD COLUMN IF NOT EXISTS "template_resolved_by" VARCHAR(32),
      ADD COLUMN IF NOT EXISTS "template_qr_enabled" BOOLEAN,
      ADD COLUMN IF NOT EXISTS "template_serial_pattern" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "template_security_features" JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS "template_label_structure" TEXT,
      ADD COLUMN IF NOT EXISTS "merchant_id" VARCHAR(128),
      ADD COLUMN IF NOT EXISTS "merchant_name" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "batch_id" UUID
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "stamp_label_batches" (
        "id" UUID PRIMARY KEY,
        "organization_id" UUID,
        "batch_number" VARCHAR(128) NOT NULL UNIQUE,
        "status" VARCHAR(32) NOT NULL DEFAULT 'GENERATED',
        "total_count" INTEGER NOT NULL DEFAULT 0,
        "generated_count" INTEGER NOT NULL DEFAULT 0,
        "issued_count" INTEGER NOT NULL DEFAULT 0,
        "printed_count" INTEGER NOT NULL DEFAULT 0,
        "printed_at" TIMESTAMPTZ,
        "notes" TEXT,
        "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "stamp_label_templates" (
        "id" UUID PRIMARY KEY,
        "organization_id" UUID,
        "code" VARCHAR(128) NOT NULL UNIQUE,
        "version" VARCHAR(32) NOT NULL DEFAULT 'v1',
        "lifecycle_status" VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
        "resolved_by" VARCHAR(32) NOT NULL DEFAULT 'PRODUCT',
        "product_id" UUID,
        "variant_id" UUID,
        "category_id" UUID,
        "code_format" VARCHAR(32) NOT NULL DEFAULT 'QR',
        "uid_prefix" VARCHAR(64),
        "package_level" VARCHAR(32) NOT NULL DEFAULT 'UNIT',
        "qr_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
        "serial_pattern" VARCHAR(255),
        "label_structure" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "stamp_label_template_security_features" (
        "id" UUID PRIMARY KEY,
        "template_id" UUID NOT NULL,
        "feature_code" VARCHAR(64) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uniq_stamp_template_security_feature"
      ON "stamp_label_template_security_features" ("template_id", "feature_code")
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "stamp_label_events" (
        "id" UUID PRIMARY KEY,
        "organization_id" UUID,
        "stamp_label_id" UUID NOT NULL,
        "stamp_uid" VARCHAR(128) NOT NULL,
        "event_type" VARCHAR(32) NOT NULL,
        "from_status" VARCHAR(32),
        "to_status" VARCHAR(32),
        "actor_type" VARCHAR(32),
        "actor_id" VARCHAR(128),
        "actor_name" VARCHAR(255),
        "location_code" VARCHAR(128),
        "verification_channel" VARCHAR(32),
        "verification_result" VARCHAR(32),
        "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "stamp_label_verification_attempts" (
        "id" UUID PRIMARY KEY,
        "organization_id" UUID,
        "stamp_label_id" UUID,
        "stamp_uid" VARCHAR(128) NOT NULL,
        "channel" VARCHAR(32),
        "result" VARCHAR(32) NOT NULL,
        "stamp_status" VARCHAR(32),
        "location_code" VARCHAR(128),
        "inspector_badge" VARCHAR(128),
        "remarks" TEXT,
        "actor_id" VARCHAR(128),
        "actor_name" VARCHAR(255),
        "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "verified_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_stamp_labels_status"
      ON "stamp_labels" ("status")
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_stamp_labels_stamp_request_id"
      ON "stamp_labels" ("stamp_request_id")
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_stamp_label_events_stamp_label_id"
      ON "stamp_label_events" ("stamp_label_id")
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_stamp_label_verification_attempts_stamp_uid"
      ON "stamp_label_verification_attempts" ("stamp_uid")
    `);
  })().catch((error) => {
    stampLabelSchemaReadyPromise = null;
    throw error;
  });

  return stampLabelSchemaReadyPromise;
}
