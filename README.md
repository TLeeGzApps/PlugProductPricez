# Profit Calculator — Full Stack

## Overview
Express + SQLite backend with your existing client served as static files. Features server-side history, CSV export, and an API for programmatic access.

## Quick start (local)
1. Install Node 20+.
2. From the `server/` folder:
   ```bash
   npm install
   npm run migrate               # optional: runs migrations if sqlite CLI available
   node server.js
