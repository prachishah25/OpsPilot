const express = require('express');
const cors = require('cors');

const incidentRoutes = require('./routes/incidentRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/incidents', incidentRoutes);
app.use('/api/auth', authRoutes);

// Health/test route
app.get('/', (req, res) => {
  res.send('OpsPilot backend is running');
});

module.exports = app;