const express = require('express');

const cors = require('cors');

const incidentRoutes = require(
  './routes/incidentRoutes'
);

const authRoutes = require(
  './routes/authRoutes'
);

const observabilityRoutes = require(
  './routes/observabilityRoutes'
);

const realtimeRoutes = require(
  './routes/realtimeRoutes'
);

const {
  register,
  metricsMiddleware,
} = require(
  './middleware/metricsMiddleware'
);

const app = express();

// -----------------------------------
// MIDDLEWARE
// -----------------------------------

app.use(cors());

app.use(express.json());

app.use(metricsMiddleware);

// -----------------------------------
// PROMETHEUS METRICS
// -----------------------------------

app.get(
  '/metrics',
  async (req, res) => {
    try {
      res.set(
        'Content-Type',
        register.contentType
      );

      const metrics =
        await register.metrics();

      res.send(metrics);
    } catch (error) {
      console.error(
        'Error generating metrics:',
        error.message
      );

      res
        .status(500)
        .send(
          'Error generating metrics'
        );
    }
  }
);

// -----------------------------------
// API ROUTES
// -----------------------------------

app.use(
  '/api/incidents',
  incidentRoutes
);

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/observability',
  observabilityRoutes
);

app.use(
  '/api/realtime',
  realtimeRoutes
);

// -----------------------------------
// HEALTH ROUTE
// -----------------------------------

app.get('/', (req, res) => {
  res.send(
    'OpsPilot backend is running'
  );
});

module.exports = app;