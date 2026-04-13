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
        "stamp_uid" VARCHAR(128) NOT NULL UNIQUE,
        "digital_link" VARCHAR(512),
        "code_format" VARCHAR(32) NOT NULL DEFAULT 'GS1_DATAMATRIX',
        "status" VARCHAR(32) NOT NULL DEFAULT 'GENERATED',
        "operator_type" VARCHAR(32) NOT NULL,
        "operator_name" VARCHAR(255) NOT NULL,
        "operator_tin" VARCHAR(64) NOT NULL,
        "operator_license_number" VARCHAR(128),
        "ethiopia_revenue_office" VARCHAR(255),
        "product_id" UUID,
        "product_name" VARCHAR(255),
        "package_level" VARCHAR(32) NOT NULL DEFAULT 'UNIT',
        "batch_number" VARCHAR(128),
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
      ADD COLUMN IF NOT EXISTS "stamp_request_number" VARCHAR(64)
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
  })().catch((error) => {
    stampLabelSchemaReadyPromise = null;
    throw error;
  });

  return stampLabelSchemaReadyPromise;
}
