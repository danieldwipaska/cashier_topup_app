CREATE TABLE fnbs (
id UUID NOT NULL PRIMARY KEY,
menu VARCHAR(50) NOT NULL,
kind TEXT NOT NULL, 
netto INT,
price INT NOT NULL,
raw_mat TEXT[],
raw_amount INT[],
created_at TIMESTAMPTZ NOT NULL,
updated_at TIMESTAMPTZ NOT NULL
);
