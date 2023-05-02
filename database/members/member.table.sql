CREATE TABLE cards (
id UUID NOT NULL PRIMARY KEY,
fullname TEXT NOT NULL,
customer_id UUID NOT NULL,
barcode VARCHAR(50),
birth_date DATE NOT NULL,
phone_number VARCHAR(20) NOT NULL,
is_active BOOLEAN NOT NULL,
address BOOLEAN,
email VARCHAR(50),
instagram VARCHAR(50),
facebook VARCHAR(50),
twitter VARCHAR(50),
created_at TIMESTAMPTZ NOT NULL,
updated_at TIMESTAMPTZ NOT NULL
);
