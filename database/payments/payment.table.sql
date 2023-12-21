CREATE TYPE sort AS ENUM ('topup', 'pay', 'checkout');
CREATE TABLE payments (
id UUID NOT NULL PRIMARY KEY,
action sort NOT NULL,
barcode VARCHAR(50) NOT NULL,
customer_name VARCHAR(50) NOT NULL,
customer_id VARCHAR(50) NOT NULL, 
payment INT NOT NULL,
invoice_number VARCHAR(50),
invoice_status VARCHAR(50),
initial_balance INT,
final_balance INT,
served_by VARCHAR(50),
collected_by VARCHAR(50),
created_at TIMESTAMPTZ NOT NULL,
updated_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE payments ADD COLUMN payment_method VARCHAR(50);
ALTER TABLE payments ADD COLUMN notes TEXT;

ALTER TABLE payments ADD COLUMN menu_names TEXT[];
ALTER TABLE payments ADD COLUMN menu_amount INT[];
ALTER TABLE payments ADD COLUMN menu_prices INT[];
ALTER TABLE payments ADD COLUMN menu_kinds VARCHAR(50)[];

ALTER TABLE payments ADD COLUMN menu_discounts BOOLEAN[];
ALTER TABLE payments ADD COLUMN menu_discount_percents INT[];

ALTER TYPE sort ADD VALUE 'refund' AFTER 'checkout';
ALTER TYPE sort ADD VALUE 'exchange' AFTER 'refund';
