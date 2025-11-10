const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  dataDir: process.env.DATA_DIR || path.join(__dirname, '../data'),
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  timeout: {
    search: 20000,
    download: 30000
  }
};
