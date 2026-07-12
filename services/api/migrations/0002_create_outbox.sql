CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    topic TEXT NOT NULL CHECK (char_length(btrim(topic)) BETWEEN 1 AND 120),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ
);
