-- Add composite index to support "latest product per active category" queries
-- and efficient category listing pages (WHERE category_id = ? AND is_active = true ORDER BY created_at DESC).
-- This avoids per-category round trips (N+1) and full table scans as the catalogue grows.
CREATE INDEX "products_category_active_created_idx" ON "products" ("category_id", "is_active", "created_at" DESC);
