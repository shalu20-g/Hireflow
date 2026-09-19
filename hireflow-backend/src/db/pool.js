'use strict';

const { Pool } = require('pg');

// Lazy singleton so requiring this module never opens a connection.
// The pool connects on first query. All queries must use $1-style
// parameters - never interpolate values into SQL strings.
let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

// Test hook: swap in a different pool (e.g. in-memory) without touching code.
function setPool(next) {
  pool = next;
}

module.exports = { getPool, setPool };
