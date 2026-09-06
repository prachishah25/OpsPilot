const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: 'opspilot_',
});

const httpRequestsTotal = new client.Counter({
  name: 'opspilot_http_requests_total',
  help: 'Total number of HTTP requests received by OpsPilot',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDurationSeconds =
  new client.Histogram({
    name: 'opspilot_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [
      0.05,
      0.1,
      0.25,
      0.5,
      1,
      2.5,
      5,
      10,
      30,
    ],
    registers: [register],
  });

const httpErrorsTotal = new client.Counter({
  name: 'opspilot_http_errors_total',
  help: 'Total number of HTTP responses with status code 400 or higher',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const aiRequestDurationSeconds =
  new client.Histogram({
    name: 'opspilot_ai_request_duration_seconds',
    help: 'Duration of Gemini AI requests in seconds',
    labelNames: ['operation'],
    buckets: [
      0.1,
      0.25,
      0.5,
      1,
      2,
      5,
      10,
      20,
      45,
    ],
    registers: [register],
  });

const embeddingDurationSeconds =
  new client.Histogram({
    name: 'opspilot_embedding_duration_seconds',
    help: 'Duration of embedding generation in seconds',
    labelNames: ['operation'],
    buckets: [
      0.05,
      0.1,
      0.25,
      0.5,
      1,
      2,
      5,
      10,
    ],
    registers: [register],
  });

const semanticSearchDurationSeconds =
  new client.Histogram({
    name: 'opspilot_semantic_search_duration_seconds',
    help: 'Duration of semantic similarity searches in seconds',
    labelNames: ['operation'],
    buckets: [
      0.05,
      0.1,
      0.25,
      0.5,
      1,
      2,
      5,
      10,
      30,
    ],
    registers: [register],
  });

const metricsMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();

    const durationSeconds =
      Number(endTime - startTime) / 1_000_000_000;

    const route =
      req.route?.path ||
      req.baseUrl ||
      req.path ||
      'unknown';

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);

    httpRequestDurationSeconds.observe(
      labels,
      durationSeconds
    );

    if (res.statusCode >= 400) {
      httpErrorsTotal.inc(labels);
    }
  });

  next();
};

module.exports = {
  register,
  metricsMiddleware,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  httpErrorsTotal,
  aiRequestDurationSeconds,
  embeddingDurationSeconds,
  semanticSearchDurationSeconds,
};