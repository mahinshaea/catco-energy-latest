CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY, payload TEXT, submitted INTEGER NOT NULL,
  origin_hash TEXT, acknowledged INTEGER
);
CREATE INDEX IF NOT EXISTS enquiries_pending ON enquiries(acknowledged, submitted);
CREATE INDEX IF NOT EXISTS enquiries_rate ON enquiries(origin_hash, submitted);
