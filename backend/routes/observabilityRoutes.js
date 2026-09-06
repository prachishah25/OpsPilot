const express = require('express');

const authMiddleware = require(
  '../middleware/authMiddleware'
);

const {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  httpErrorsTotal,
  aiRequestDurationSeconds,
  embeddingDurationSeconds,
  semanticSearchDurationSeconds,
} = require('../middleware/metricsMiddleware');

const router = express.Router();

router.use(authMiddleware);

// -----------------------------------
// METRIC HELPERS
// -----------------------------------

const getCounterTotal = async (metric) => {
  const data = await metric.get();

  return data.values.reduce(
    (total, item) => total + item.value,
    0
  );
};

const getHistogramStats = async (
  metric,
  metricName
) => {
  const data = await metric.get();

  let totalDuration = 0;
  let totalCount = 0;

  data.values.forEach((item) => {
    if (
      item.metricName ===
      `${metricName}_sum`
    ) {
      totalDuration += item.value;
    }

    if (
      item.metricName ===
      `${metricName}_count`
    ) {
      totalCount += item.value;
    }
  });

  const averageSeconds =
    totalCount === 0
      ? 0
      : totalDuration / totalCount;

  return {
    count: totalCount,

    totalSeconds: Number(
      totalDuration.toFixed(3)
    ),

    averageSeconds: Number(
      averageSeconds.toFixed(3)
    ),

    averageMilliseconds: Number(
      (averageSeconds * 1000).toFixed(1)
    ),
  };
};

// -----------------------------------
// OBSERVABILITY SUMMARY
// -----------------------------------

router.get('/summary', async (req, res) => {
  try {
    const totalRequests =
      await getCounterTotal(
        httpRequestsTotal
      );

    const totalErrors =
      await getCounterTotal(
        httpErrorsTotal
      );

    const httpLatency =
      await getHistogramStats(
        httpRequestDurationSeconds,
        'opspilot_http_request_duration_seconds'
      );

    const aiLatency =
      await getHistogramStats(
        aiRequestDurationSeconds,
        'opspilot_ai_request_duration_seconds'
      );

    const embeddingLatency =
      await getHistogramStats(
        embeddingDurationSeconds,
        'opspilot_embedding_duration_seconds'
      );

    const semanticSearchLatency =
      await getHistogramStats(
        semanticSearchDurationSeconds,
        'opspilot_semantic_search_duration_seconds'
      );

    const errorRate =
      totalRequests === 0
        ? 0
        : (totalErrors / totalRequests) * 100;

    return res.json({
      generatedAt: new Date(),

      http: {
        totalRequests,

        totalErrors,

        errorRate: Number(
          errorRate.toFixed(1)
        ),

        averageLatencyMs:
          httpLatency.averageMilliseconds,

        totalLatencySeconds:
          httpLatency.totalSeconds,
      },

      ai: {
        totalRequests:
          aiLatency.count,

        averageLatencySeconds:
          aiLatency.averageSeconds,

        totalLatencySeconds:
          aiLatency.totalSeconds,
      },

      embeddings: {
        totalGenerated:
          embeddingLatency.count,

        averageLatencyMs:
          embeddingLatency.averageMilliseconds,

        totalLatencySeconds:
          embeddingLatency.totalSeconds,
      },

      semanticSearch: {
        totalSearches:
          semanticSearchLatency.count,

        averageLatencySeconds:
          semanticSearchLatency.averageSeconds,

        totalLatencySeconds:
          semanticSearchLatency.totalSeconds,
      },
    });
  } catch (error) {
    console.error(
      'OBSERVABILITY SUMMARY ERROR:',
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        'Failed to load observability metrics',
    });
  }
});

module.exports = router;