import { sequelize } from '../../../../shared/db/database.js';

let stampSchemaReadyPromise = null;

/**
 * Ensures excise_stamp_requests has payment/review/generated columns (idempotent).
 * Backfills generated_quantity from stamp_labels when that table exists.
 */
export async function ensureStampRequestSchema() {
  if (stampSchemaReadyPromise) {
    return stampSchemaReadyPromise;
  }

  stampSchemaReadyPromise = (async () => {
    await sequelize.query(`
      ALTER TABLE "excise_stamp_requests"
      ADD COLUMN IF NOT EXISTS "product_id" UUID,
      ADD COLUMN IF NOT EXISTS "product_name" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "variant_id" UUID,
      ADD COLUMN IF NOT EXISTS "variant_name" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "uom_id" UUID,
      ADD COLUMN IF NOT EXISTS "uom_name" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "stamp_fee_amount" DECIMAL(18,2),
      ADD COLUMN IF NOT EXISTS "stamp_fee_currency" VARCHAR(8),
      ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR(32) DEFAULT 'UNPAID',
      ADD COLUMN IF NOT EXISTS "payment_reference" VARCHAR(128),
      ADD COLUMN IF NOT EXISTS "payment_proof_url" VARCHAR(500),
      ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "review_due_at" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "reviewed_by_user_id" UUID,
      ADD COLUMN IF NOT EXISTS "review_sla_breached" BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS "generated_quantity" INTEGER NOT NULL DEFAULT 0
    `);

    try {
      await sequelize.query(`
        UPDATE excise_stamp_requests r
        SET generated_quantity = s.cnt
        FROM (
          SELECT stamp_request_id, COUNT(*)::int AS cnt
          FROM stamp_labels
          GROUP BY stamp_request_id
        ) s
        WHERE r.id = s.stamp_request_id
      `);
    } catch (err) {
      const code = err?.parent?.code || err?.original?.code;
      const msg = String(err?.message || '');
      if (code !== '42P01' && !msg.includes('stamp_labels')) {
        throw err;
      }
    }
  })().catch((error) => {
    stampSchemaReadyPromise = null;
    throw error;
  });

  return stampSchemaReadyPromise;
}
