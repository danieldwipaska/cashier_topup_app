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
