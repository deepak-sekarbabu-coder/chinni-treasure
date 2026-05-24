# Chinni Treasure — PostgreSQL Database Design Document

## 1. Overview

This document outlines the PostgreSQL database schema for the **Chinni Treasure — Little Love** e-commerce platform. The design migrates from the current localStorage-based state management to a robust relational database with proper normalization, constraints, and relationships.

---

## 2. Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    products     │     │   order_items   │     │     orders      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────┤ product_id (FK) │     │ id (PK)         │
│ name            │  1:M│ order_id (FK)   ├────►│ order_number    │
│ category_id(FK) │     │ quantity        │  M:1│ customer_name   │
│ price           │     │ unit_price      │     │ customer_email  │
│ stock_quantity  │     └─────────────────┘     │ customer_phone  │
│ image_url       │                             │ shipping_address│
│ description     │     ┌─────────────────┐     │ status          │
│ badge           │     │   categories    │     │ tracking_id     │
│ is_active       │     ├─────────────────┤     │ total_amount    │
│ created_at      │     │ id (PK)         │     │ created_at      │
│ updated_at      │     │ name            │     │ updated_at      │
└─────────────────┘     │ slug            │     └─────────────────┘
                        │ display_order   │              │
                        └─────────────────┘              │
                                                         │
                        ┌─────────────────┐              │
                        │  order_status   │◄─────────────┘
                        │   _history      │
                        ├─────────────────┤
                        │ id (PK)         │
                        │ order_id (FK)   │
                        │ status          │
                        │ notes           │
                        │ created_by (FK) │
                        │ created_at      │
                        └─────────────────┘
                                 │
                                 │
                        ┌────────┴────────┐
                        │     admins      │
                        ├─────────────────┤
                        │ id (PK)         │
                        │ username        │
                        │ password_hash   │
                        │ email           │
                        │ role            │
                        │ is_active       │
                        │ last_login_at   │
                        │ created_at      │
                        └─────────────────┘
```

---

## 3. Schema Definition

### 3.1 Extensions

```sql
-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 3.2 Enums

```sql
-- Order status enum
CREATE TYPE order_status AS ENUM (
    'pending',
    'approved', 
    'packaging',
    'shipped',
    'delivered',
    'rejected'
);

-- Product category enum (or use reference table for extensibility)
CREATE TYPE product_badge AS ENUM (
    'bestseller',
    'new',
    'premium', 
    'limited',
    'luxury'
);

-- Admin role enum
CREATE TYPE admin_role AS ENUM (
    'admin',
    'super_admin'
);
```

### 3.3 Tables

#### 3.3.1 Categories

```sql
CREATE TABLE categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    display_order   INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = TRUE;
```

#### 3.3.2 Products

```sql
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku             VARCHAR(50) UNIQUE,
    name            VARCHAR(255) NOT NULL,
    category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    description     TEXT,
    price           DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity  INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url       VARCHAR(500),
    badge           product_badge,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_badge ON products(badge) WHERE badge IS NOT NULL;
CREATE INDEX idx_products_price ON products(price);
```

#### 3.3.3 Customers (optional - for registered users)

```sql
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    name            VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255), -- NULL for guest checkout
    is_guest        BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
```

#### 3.3.4 Orders

```sql
CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number        VARCHAR(20) UNIQUE NOT NULL,
    customer_id         UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Customer details (denormalized for order integrity)
    customer_name       VARCHAR(255) NOT NULL,
    customer_email      VARCHAR(255) NOT NULL,
    customer_phone      VARCHAR(20) NOT NULL,
    
    -- Shipping address
    address_line1       VARCHAR(255) NOT NULL,
    address_line2       VARCHAR(255),
    city                VARCHAR(100) NOT NULL,
    state_code          VARCHAR(2) NOT NULL,
    postal_code         VARCHAR(6) NOT NULL,
    country_code        VARCHAR(2) DEFAULT 'IN',
    
    -- Order details
    status              order_status DEFAULT 'pending',
    tracking_id         VARCHAR(100),
    
    -- Financials
    subtotal            DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    shipping_cost       DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount          DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount     DECIMAL(10, 2) DEFAULT 0.00,
    total_amount        DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    
    -- Payment
    transaction_id      VARCHAR(100),
    payment_method      VARCHAR(50),
    payment_status      VARCHAR(20) DEFAULT 'pending',
    
    -- Metadata
    customer_notes      TEXT,
    admin_notes         TEXT,
    ip_address          INET,
    user_agent          TEXT,
    
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_tracking ON orders(tracking_id) WHERE tracking_id IS NOT NULL;
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
```

#### 3.3.5 Order Items

```sql
CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Product snapshot (denormalized for historical accuracy)
    product_sku     VARCHAR(50),
    product_name    VARCHAR(255) NOT NULL,
    unit_price      DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    
    -- Calculated fields
    subtotal        DECIMAL(10, 2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

#### 3.3.6 Order Status History

```sql
CREATE TABLE order_status_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status          order_status NOT NULL,
    notes           TEXT,
    created_by      UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_status_history_created ON order_status_history(created_at);
```

#### 3.3.7 Admins

```sql
CREATE TABLE admins (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            admin_role DEFAULT 'admin',
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    login_attempts  INTEGER DEFAULT 0,
    locked_until    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_active ON admins(is_active) WHERE is_active = TRUE;
```

---

## 4. Functions and Triggers

### 4.1 Auto-Update Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 Order Number Generation

```sql
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                        LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();
```

### 4.3 Order Status History Logging

```sql
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, status, notes, created_at)
        VALUES (NEW.id, NEW.status, COALESCE(NEW.admin_notes, 'Status changed'), NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_order_status
    AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION log_order_status_change();
```

### 4.4 Stock Management on Order

```sql
CREATE OR REPLACE FUNCTION deduct_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Deduct stock when order is approved
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
        UPDATE products p
        SET stock_quantity = p.stock_quantity - oi.quantity
        FROM order_items oi
        WHERE oi.order_id = NEW.id
          AND oi.product_id = p.id;
    END IF;
    
    -- Restore stock if order is rejected
    IF OLD.status IN ('pending', 'approved', 'packaging') AND NEW.status = 'rejected' THEN
        UPDATE products p
        SET stock_quantity = p.stock_quantity + oi.quantity
        FROM order_items oi
        WHERE oi.order_id = NEW.id
          AND oi.product_id = p.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manage_stock_on_order
    AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION deduct_product_stock();
```

### 4.5 Stock Validation Before Order Approval

```sql
CREATE OR REPLACE FUNCTION check_stock_before_approval()
RETURNS TRIGGER AS $$
DECLARE
    insufficient_stock RECORD;
BEGIN
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
        SELECT p.name, p.stock_quantity, oi.quantity
        INTO insufficient_stock
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = NEW.id
          AND p.stock_quantity < oi.quantity;
        
        IF FOUND THEN
            RAISE EXCEPTION 'Insufficient stock for product: % (available: %, required: %)',
                insufficient_stock.name, 
                insufficient_stock.stock_quantity, 
                insufficient_stock.quantity;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_stock_before_approval
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION check_stock_before_approval();
```

---

## 5. Views

### 5.1 Order Summary View

```sql
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.status,
    o.total_amount,
    o.tracking_id,
    o.created_at,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_quantity
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.customer_name, o.customer_email, 
         o.customer_phone, o.status, o.total_amount, o.tracking_id, o.created_at;
```

### 5.2 Product Inventory View

```sql
CREATE VIEW product_inventory AS
SELECT 
    p.id,
    p.sku,
    p.name,
    c.name as category,
    p.price,
    p.stock_quantity,
    p.badge,
    p.is_active,
    p.created_at,
    p.updated_at,
    COALESCE(SUM(oi.quantity), 0) as units_ordered,
    COALESCE(SUM(CASE WHEN o.status NOT IN ('rejected', 'delivered') 
                      THEN oi.quantity ELSE 0 END), 0) as units_committed
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
GROUP BY p.id, p.sku, p.name, c.name, p.price, p.stock_quantity, 
         p.badge, p.is_active, p.created_at, p.updated_at;
```

### 5.3 Daily Sales Summary

```sql
CREATE VIEW daily_sales_summary AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_orders
FROM orders
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 6. Sample Data

### 6.1 Seed Categories

```sql
INSERT INTO categories (name, slug, display_order) VALUES
    ('Accessories', 'accessories', 1),
    ('Apparel', 'apparel', 2),
    ('Watches', 'watches', 3),
    ('Home', 'home', 4);
```

### 6.2 Seed Products

```sql
INSERT INTO products (sku, name, category_id, price, stock_quantity, image_url, badge, is_active) VALUES
    ('LUX-WAL-001', 'Artisan Leather Wallet', 1, 89.00, 15, 'images/wallet.jpg', 'bestseller', TRUE),
    ('LUX-SCF-001', 'Premium Silk Scarf', 2, 129.00, 8, 'images/scarf.jpg', 'new', TRUE),
    ('LUX-WAT-001', 'Handcrafted Timepiece', 3, 349.00, 5, 'images/watch.jpg', 'premium', TRUE),
    ('LUX-PER-001', 'Crystal Perfume Bottle', 4, 199.00, 3, 'images/perfume.jpg', 'limited', TRUE),
    ('LUX-BLT-001', 'Italian Leather Belt', 1, 159.00, 12, 'images/belt.jpg', NULL, TRUE),
    ('LUX-THR-001', 'Cashmere Throw Blanket', 4, 279.00, 6, 'images/blanket.jpg', 'luxury', TRUE);
```

### 6.3 Seed Admin

```sql
INSERT INTO admins (username, email, password_hash, role, is_active) VALUES
    ('admin', 'admin@chinnitreasure.com', 
     crypt('admin123', gen_salt('bf')), 
     'super_admin', 
     TRUE);
```

---

## 7. Common Queries

### 7.1 Get Order with Items

```sql
SELECT 
    o.*,
    json_agg(json_build_object(
        'id', oi.id,
        'product_name', oi.product_name,
        'unit_price', oi.unit_price,
        'quantity', oi.quantity,
        'subtotal', oi.subtotal
    )) as items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.order_number = 'ORD-20240524-0001'
GROUP BY o.id;
```

### 7.2 Track Order by Phone

```sql
SELECT 
    order_number,
    status,
    total_amount,
    tracking_id,
    created_at
FROM orders
WHERE customer_phone = '9876543210'
ORDER BY created_at DESC;
```

### 7.3 Low Stock Report

```sql
SELECT 
    name,
    stock_quantity,
    CASE 
        WHEN stock_quantity = 0 THEN 'out_of_stock'
        WHEN stock_quantity <= 5 THEN 'low_stock'
        ELSE 'in_stock'
    END as stock_status
FROM products
WHERE stock_quantity <= 5
ORDER BY stock_quantity ASC;
```

### 7.4 Orders by Status

```sql
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_amount) as total_value
FROM orders
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'pending' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'packaging' THEN 3
        WHEN 'shipped' THEN 4
        WHEN 'delivered' THEN 5
        WHEN 'rejected' THEN 6
    END;
```

---

## 8. Migration from localStorage

### 8.1 Products Migration

```javascript
// Read from localStorage
const products = JSON.parse(localStorage.getItem('luxe_products') || '[]');

// Transform and insert
const insertQuery = `
    INSERT INTO products (id, name, price, stock_quantity, image_url, description, badge, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        stock_quantity = EXCLUDED.stock_quantity,
        updated_at = NOW()
`;
```

### 8.2 Orders Migration

```javascript
const orders = JSON.parse(localStorage.getItem('luxe_orders') || '[]');

// Transform order structure
const transformedOrders = orders.map(order => ({
    order_number: order.id,
    customer_name: order.customer.name,
    customer_email: order.customer.email,
    customer_phone: order.customer.phone,
    address_line1: order.customer.address,
    city: order.customer.city,
    state_code: order.customer.state,
    postal_code: order.customer.zip,
    country_code: order.customer.country === 'IN' ? 'IN' : 'OTHER',
    status: order.status,
    tracking_id: order.trackingId,
    subtotal: order.total,
    shipping_cost: order.shipping,
    total_amount: order.grandTotal,
    transaction_id: order.transactionId,
    customer_notes: order.notes,
    created_at: order.date
}));
```

---

## 9. Backup and Maintenance

### 9.1 Automated Backups

```bash
# Daily backup script
pg_dump -h localhost -U postgres -d chinnitreasure > backups/backup_$(date +%Y%m%d).sql
```

### 9.2 Performance Optimization

```sql
-- Analyze tables for query planner
ANALYZE orders;
ANALYZE order_items;
ANALYZE products;

-- Reindex if needed
REINDEX TABLE orders;

-- Archive old delivered orders (optional)
CREATE TABLE orders_archive (LIKE orders INCLUDING ALL);
INSERT INTO orders_archive SELECT * FROM orders WHERE status = 'delivered' AND created_at < NOW() - INTERVAL '1 year';
```

---

## 10. Security Considerations

1. **Row Level Security (RLS)** for multi-tenant scenarios
2. **Password hashing** using `pgcrypto` with bcrypt
3. **Prepared statements** to prevent SQL injection
4. **Connection pooling** (PgBouncer recommended for production)
5. **SSL/TLS** for all database connections
6. **Regular backups** with point-in-time recovery

---

## 11. Scaling Considerations

| Table | Expected Growth | Strategy |
|-------|-----------------|----------|
| products | Low (< 1000) | Standard indexing |
| orders | High (10K+/year) | Partition by date |
| order_items | Very High | Archive old data |
| order_status_history | Very High | Archive with orders |

### Partitioning Orders by Year

```sql
CREATE TABLE orders_2024 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE orders_2025 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```
