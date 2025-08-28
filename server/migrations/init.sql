-- Initializes a simple history table for calculator runs
CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  total_cost REAL NOT NULL,
  grams REAL NOT NULL,
  ounces REAL NOT NULL,
  unit TEXT NOT NULL,
  cost_per_gram REAL NOT NULL,
  profit_json TEXT NOT NULL,
  rows_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp);
