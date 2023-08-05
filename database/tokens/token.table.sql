CREATE TABLE tokens (
id UUID NOT NULL PRIMARY KEY,
access_token TEXT NOT NULL,
token_type VARCHAR(50) NOT NULL,
expires_in INT NOT NULL,
expires_at INT NOT NULL,
scope TEXT NOT NULL,
refresh_token TEXT NOT NULL,
created_at TIMESTAMPTZ NOT NULL,
);