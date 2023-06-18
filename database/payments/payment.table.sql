CREATE TYPE sort AS ENUM ('topup', 'pay', 'checkout');
CREATE TABLE payments (
id UUID NOT NULL PRIMARY KEY,
sort sort NOT NULL,
barcode VARCHAR(50) NOT NULL,
customer_name VARCHAR(50),
customer_id UUID NOT NULL, 
payment INT NOT NULL,
service INT,
tax INT,
discount_name TEXT[],
menu TEXT,
paid_off BOOLEAN NOT NULL,
amount INT,
total_price INT,
invoice_number TEXT,
res_balance INT,
username VARCHAR(50) NOT NULL,
created_at TIMESTAMPTZ NOT NULL,
updated_at TIMESTAMPTZ NOT NULL
);
