CREATE TABLE fnbs (
id UUID NOT NULL PRIMARY KEY,
menu VARCHAR(50) NOT NULL,
kind VARCHAR(50), 
price INT NOT NULL,
raw_mat TEXT[],
raw_amount INT[],
created_at TIMESTAMPTZ NOT NULL,
updated_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE fnbs ADD COLUMN discount_percent INT;
ALTER TABLE fnbs ADD COLUMN discount_status BOOLEAN;
