CREATE TABLE payments (
id UUID NOT NULL PRIMARY KEY,
barcode VARCHAR(50) NOT NULL,
customer_name VARCHAR(50),
customer_id UUID NOT NULL, 
payment INT NOT NULL,
menu TEXT NOT NULL,
paid_off BOOLEAN NOT NULL,
amount INT NOT NULL,
invoice_number TEXT,
created_at TIMESTAMPTZ NOT NULL,
updated_at TIMESTAMPTZ NOT NULL
);
