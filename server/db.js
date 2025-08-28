// db.js — lightweight wrapper over better-sqlite3
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.sqlite');

function init() {
  const db = new Database(DB_PATH);
  // Ensure table exists if migrations not run
  db.exec(`
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
  `);
  return db;
}

module.exports = init();
