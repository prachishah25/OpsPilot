const { GoogleGenAI } = require('@google/genai');

const {
  embeddingDurationSeconds,
} = require('../middleware/metricsMiddleware');

const getEmbedding = async (text) => {
  if (!text || !text.trim()) {
    throw new Error(
      'Text is required to create an embedding'
    );
  }

  const geminiKey =
    process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    throw new Error(
      'Gemini API key is not configured'
    );
  }

  const ai = new GoogleGenAI({
    apiKey: geminiKey,
  });

  const stopTimer =
    embeddingDurationSeconds.startTimer({
      operation: 'embedding_generation',
    });

  try {
    const response =
      await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
      });

    if (
      !response.embeddings ||
      response.embeddings.length === 0
    ) {
      throw new Error(
        'Gemini did not return an embedding'
      );
    }

    return response.embeddings[0].values;
  } finally {
    stopTimer();
  }
};

module.exports = getEmbedding;