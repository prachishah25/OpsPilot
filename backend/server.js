const dns = require('dns');
const mongoose = require('mongoose');

require('dotenv').config();

const {
  initializePostgres,
} = require('./services/postgresService');

dns.setServers([
  '8.8.8.8',
  '1.1.1.1',
]);

const app = require('./app');

console.log(
  'Gemini key loaded:',
  Boolean(process.env.GEMINI_API_KEY)
);

const PORT =
  process.env.PORT || 5001;

const startServer = async () => {
  try {
    // -----------------------------------
    // CONNECT TO MONGODB
    // -----------------------------------

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      'MongoDB connected'
    );

    // -----------------------------------
    // INITIALIZE POSTGRESQL ANALYTICS
    // -----------------------------------

    await initializePostgres();

    console.log(
      'PostgreSQL connected'
    );

    // -----------------------------------
    // START EXPRESS SERVER
    // -----------------------------------

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      'Server startup error:',
      error
    );

    process.exit(1);
  }
};

startServer();