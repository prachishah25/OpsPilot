const dns = require('dns');
const mongoose = require('mongoose');

require('dotenv').config();

dns.setServers([
  '8.8.8.8',
  '1.1.1.1',
]);

const app = require('./app');

console.log(
  'Gemini key loaded:',
  Boolean(process.env.GEMINI_API_KEY)
);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      'MongoDB connection error:',
      error
    );

    process.exit(1);
  }
};

startServer();