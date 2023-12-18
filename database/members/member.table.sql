CREATE TABLE members (
id UUID NOT NULL PRIMARY KEY,
identity_number VARCHAR(50) NOT NULL,
fullname TEXT NOT NULL,
customer_id VARCHAR(50) NOT NULL,
barcode VARCHAR(50),
birth_date DATE NOT NULL,
phone_number VARCHAR(20) NOT NULL,
is_active BOOLEAN NOT NULL,
address TEXT,
email VARCHAR(50),
instagram VARCHAR(50),
facebook VARCHAR(50),
twitter VARCHAR(50),
created_at TIMESTAMPTZ NOT NULL,
updated_at TIMESTAMPTZ NOT NULL
);
