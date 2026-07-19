-- CreateIndex
CREATE INDEX "products_is_active_deleted_at_stock_quantity_idx" ON "products"("is_active", "deleted_at", "stock_quantity");

-- CreateIndex
CREATE INDEX "products_is_active_deleted_at_name_idx" ON "products"("is_active", "deleted_at", "name");
