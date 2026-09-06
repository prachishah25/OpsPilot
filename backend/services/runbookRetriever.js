const incidentRunbooks = require('../runbooks/incidentRunbooks');
const getEmbedding = require('./embeddingService');
const cosineSimilarity = require('./vectorUtils');

const {
  semanticSearchDurationSeconds,
} = require('../middleware/metricsMiddleware');

const keywordRetrieve = (
  title,
  description,
  limit = 2
) => {
  const incidentText = `${title || ''} ${
    description || ''
  }`.toLowerCase();

  const scoredRunbooks = incidentRunbooks.map(
    (runbook) => {
      let score = 0;
      const matchedKeywords = [];

      runbook.keywords.forEach((keyword) => {
        if (
          incidentText.includes(
            keyword.toLowerCase()
          )
        ) {
          score += 1;
          matchedKeywords.push(keyword);
        }
      });

      return {
        ...runbook,
        score,
        matchedKeywords,
        retrievalType: 'keyword',
      };
    }
  );

  const minimumScore = 2;

  return scoredRunbooks
    .filter(
      (runbook) =>
        runbook.score >= minimumScore
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

const semanticRetrieve = async (
  title,
  description,
  limit = 2
) => {
  const stopTimer =
    semanticSearchDurationSeconds.startTimer({
      operation: 'runbook_semantic_search',
    });

  try {
    const incidentText = `
Title: ${title || ''}

Description:
${description || ''}
`;

    const incidentEmbedding =
      await getEmbedding(incidentText);

    const scoredRunbooks = [];

    for (const runbook of incidentRunbooks) {
      const runbookText = `
Title: ${runbook.title}

Category:
${runbook.category}

Content:
${runbook.content}
`;

      const runbookEmbedding =
        await getEmbedding(runbookText);

      const similarity = cosineSimilarity(
        incidentEmbedding,
        runbookEmbedding
      );

      scoredRunbooks.push({
        ...runbook,
        semanticScore: similarity,
        retrievalType: 'semantic',
        matchedKeywords: [],
      });
    }

    const minimumSimilarity = 0.72;

    return scoredRunbooks
      .filter(
        (runbook) =>
          runbook.semanticScore >=
          minimumSimilarity
      )
      .sort(
        (a, b) =>
          b.semanticScore -
          a.semanticScore
      )
      .slice(0, limit);
  } finally {
    stopTimer();
  }
};

const retrieveRelevantRunbooks = async (
  title,
  description,
  limit = 2
) => {
  try {
    const semanticResults =
      await semanticRetrieve(
        title,
        description,
        limit
      );

    if (semanticResults.length > 0) {
      return semanticResults;
    }

    console.log(
      'No semantic matches found. Using keyword fallback.'
    );

    return keywordRetrieve(
      title,
      description,
      limit
    );
  } catch (error) {
    console.error(
      'Semantic retrieval failed. Using keyword fallback:',
      error.message
    );

    return keywordRetrieve(
      title,
      description,
      limit
    );
  }
};

module.exports = retrieveRelevantRunbooks;