CREATE TABLE stocks (
id UUID NOT NULL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
amount INT NOT NULL,
unit VARCHAR(50) NOT NULL,
created_at TIMESTAMPTZ NOT NULL,
updated_at TIMESTAMPTZ NOT NULL
);