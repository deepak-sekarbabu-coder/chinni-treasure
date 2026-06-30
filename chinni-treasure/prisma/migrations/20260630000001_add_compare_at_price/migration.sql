-- Add compare_at_price column to products table
-- This stores the original/comparison price (MRP) for showing discounts
ALTER TABLE "products" ADD COLUMN "compare_at_price" DECIMAL(10,2);
