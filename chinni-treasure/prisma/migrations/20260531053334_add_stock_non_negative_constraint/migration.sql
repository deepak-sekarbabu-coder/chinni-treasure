-- Add CHECK constraint to prevent negative stock quantities
ALTER TABLE "products" ADD CONSTRAINT "products_stock_non_negative" CHECK ("stock_quantity" >= 0);