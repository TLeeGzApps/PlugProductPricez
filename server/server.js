// server.js — Express API to save/fetch/export calculator history
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serve static client (assumes client built into public)
app.use('/', express.static(path.join(__dirname, '..', 'client')));

// Create prepared statements
const insertStmt = db.prepare(`
  INSERT INTO history (timestamp, total_cost, grams, ounces, unit, cost_per_gram, profit_json, rows_json)
  VALUES (@timestamp, @total_cost, @grams, @ounces, @unit, @cost_per_gram, @profit_json, @rows_json)
`);
const selectAllStmt = db.prepare(`SELECT * FROM history ORDER BY id DESC LIMIT 1000`);
const selectByIdStmt = db.prepare(`SELECT * FROM history WHERE id = ?`);

// API: save current calculation
app.post('/api/history', (req, res) => {
  try {
    const payload = req.body;
    // Basic server-side validation
    if (!payload || typeof payload.totalCost !== 'number' || payload.totalCost <= 0) {
      return res.status(400).json({ error: 'Invalid payload: totalCost required' });
    }
    const record = {
      timestamp: new Date().toISOString(),
      total_cost: payload.totalCost,
      grams: payload.grams,
      ounces: payload.ounces,
      unit: payload.unit || 'g',
      cost_per_gram: payload.costPerGram,
      profit_json: JSON.stringify(payload.profit || {}),
      rows_json: JSON.stringify(payload.rows || [])
    };
    const info = insertStmt.run(record);
    res.status(201).json({ id: info.lastInsertRowid, ...record });
  } catch (err) {
    console.error('Save error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: list history
app.get('/api/history', (req, res) => {
  try {
    const rows = selectAllStmt.all();
    // parse JSON fields
    const parsed = rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      totalCost: r.total_cost,
      grams: r.grams,
      ounces: r.ounces,
      unit: r.unit,
      costPerGram: r.cost_per_gram,
      profit: JSON.parse(r.profit_json),
      rows: JSON.parse(r.rows_json)
    }));
    res.json(parsed);
  } catch (err) {
    console.error('Fetch error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: export history as CSV
app.get('/api/history/export', (req, res) => {
  try {
    const rows = selectAllStmt.all();
    // header
    const header = ['Date,Spent,Grams,Ounces,Unit,CostPerGram,Profit_g,Profit_ball,Profit_quarter,Profit_half,Profit_zip,Profit_elbow'];
    const lines = rows.map(r => {
      const p = JSON.parse(r.profit_json);
      return [
        r.timestamp,
        r.total_cost.toFixed(2),
        r.grams.toFixed(2),
        r.ounces.toFixed(2),
        r.unit,
        r.cost_per_gram.toFixed(6),
        (p.gram||0),
        (p.ball||0),
        (p.quarter||0),
        (p.half||0),
        (p.zip||0),
        (p.elbow||0)
      ].join(',');
    });
    const csv = header.concat(lines).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="history.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Export error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Optional: fetch single record
app.get('/api/history/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const row = selectByIdStmt.get(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({
      id: row.id,
      timestamp: row.timestamp,
      totalCost: row.total_cost,
      grams: row.grams,
      ounces: row.ounces,
      unit: row.unit,
      costPerGram: row.cost_per_gram,
      profit: JSON.parse(row.profit_json),
      rows: JSON.parse(row.rows_json)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Profit Calculator API listening on :${PORT}`);
});
