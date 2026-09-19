'use strict';

require('dotenv').config();
const app = require('./app');

const PORT = Number(process.env.PORT) || 5000;
if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`HireFlow API listening on port ${PORT}`);
});
