CREATE TABLE cardlogs (
id UUID NOT NULL PRIMARY KEY,
barcode VARCHAR(50) NOT NULL,
customer_name VARCHAR(50),
customer_id TEXT, 
log TEXT NOT NULL,
username VARCHAR(50) NOT NULL,
created_at TIMESTAMPTZ NOT NULL,
updated_at TIMESTAMPTZ NOT NULL
);
