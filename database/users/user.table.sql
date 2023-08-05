CREATE TYPE position AS ENUM ('developer', 'admin', 'bartender');
CREATE TABLE users (
id UUID NOT NULL PRIMARY KEY,
username VARCHAR(50) NOT NULL,
password TEXT NOT NULL, 
position "position" NOT NULL,
created_at TIMESTAMPTZ NOT NULL,
updated_at TIMESTAMPTZ NOT NULL
);