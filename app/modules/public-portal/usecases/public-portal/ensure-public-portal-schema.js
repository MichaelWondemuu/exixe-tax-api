import { randomUUID } from 'crypto';
import { sequelize } from '../../../../shared/db/database.js';

let portalSchemaReadyPromise = null;

const DEFAULT_ANNOUNCEMENTS = Object.freeze([
  {
    id: 'ANN-001',
    category: 'ALERT',
    priority: 'HIGH',
    title: 'Counterfeit stamp alert',
    message: 'Do not buy products with broken or tampered digital stamps.',
  },
  {
    id: 'ANN-002',
    category: 'REGULATORY_UPDATE',
    priority: 'MEDIUM',
    title: 'Excise compliance reminder',
    message: 'All stamped products must be verified before retail distribution.',
  },
  {
    id: 'ANN-003',
    category: 'AWARENESS',
    priority: 'LOW',
    title: 'How to verify a stamp',
    message: 'Scan the QR code or enter the stamp code to verify authenticity.',
  },
]);

export async function ensurePublicPortalSchema() {
  if (portalSchemaReadyPromise) return portalSchemaReadyPromise;

  portalSchemaReadyPromise = (async () => {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "public_portal_announcements" (
        "id" UUID PRIMARY KEY,
        "code" VARCHAR(64) UNIQUE,
        "category" VARCHAR(64) NOT NULL,
        "priority" VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
        "title" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "published_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "public_portal_reports" (
        "id" UUID PRIMARY KEY,
        "reference" VARCHAR(64) UNIQUE NOT NULL,
        "report_type" VARCHAR(64) NOT NULL,
        "stamp_uid" VARCHAR(128),
        "channel" VARCHAR(32),
        "product_name" VARCHAR(255),
        "address" VARCHAR(255),
        "city" VARCHAR(128),
        "region" VARCHAR(128),
        "woreda" VARCHAR(128),
        "latitude" DECIMAL(10,7),
        "longitude" DECIMAL(10,7),
        "location" VARCHAR(255),
        "comments" TEXT,
        "photos" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "reporter_name" VARCHAR(255),
        "reporter_contact" VARCHAR(255),
        "reporter_id" VARCHAR(128),
        "status" VARCHAR(64) NOT NULL DEFAULT 'SUBMITTED',
        "timeline" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await sequelize.query(`
      ALTER TABLE "public_portal_reports"
      ADD COLUMN IF NOT EXISTS "channel" VARCHAR(32),
      ADD COLUMN IF NOT EXISTS "address" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "city" VARCHAR(128),
      ADD COLUMN IF NOT EXISTS "region" VARCHAR(128),
      ADD COLUMN IF NOT EXISTS "woreda" VARCHAR(128),
      ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10,7),
      ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(10,7)
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "public_portal_notifications" (
        "id" UUID PRIMARY KEY,
        "reporter_id" VARCHAR(128),
        "type" VARCHAR(64) NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const row of DEFAULT_ANNOUNCEMENTS) {
      await sequelize.query(
        `
          INSERT INTO "public_portal_announcements"
            ("id", "code", "category", "priority", "title", "message", "is_active", "published_at", "created_at", "updated_at")
          VALUES
            (:id, :code, :category, :priority, :title, :message, TRUE, NOW(), NOW(), NOW())
          ON CONFLICT ("code") DO NOTHING
        `,
        {
          replacements: {
            id: randomUUID(),
            code: row.id,
            category: row.category,
            priority: row.priority,
            title: row.title,
            message: row.message,
          },
        },
      );
    }
  })().catch((error) => {
    portalSchemaReadyPromise = null;
    throw error;
  });

  return portalSchemaReadyPromise;
}
