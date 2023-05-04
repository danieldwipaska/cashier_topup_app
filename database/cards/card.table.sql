CREATE TABLE cards (
id UUID NOT NULL PRIMARY KEY,
barcode VARCHAR(50) NOT NULL,
balance INT NOT NULL,
deposit INT,
customer_name VARCHAR(50),
customer_id TEXT, 
is_member BOOLEAN NOT NULL,
is_active BOOLEAN NOT NULL,
created_at TIMESTAMPTZ NOT NULL,
updated_at TIMESTAMPTZ NOT NULL
);
