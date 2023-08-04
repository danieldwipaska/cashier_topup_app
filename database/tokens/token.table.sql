CREATE TABLE tokens (
id UUID NOT NULL PRIMARY KEY,
access_token TEXT,
refresh_token TEXT,
created_at TIMESTAMPTZ NOT NULL,
updated_at TIMESTAMPTZ NOT NULL
);