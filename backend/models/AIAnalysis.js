const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema(
  {
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    model: {
      type: String,
      required: true,
    },

    analysis: {
      summary: {
        type: String,
        required: true,
      },

      rootCauses: [
        {
          type: String,
        },
      ],

      recommendedSteps: [
        {
          type: String,
        },
      ],

      suggestedPriority: {
        type: String,
        enum: [
          'Low',
          'Medium',
          'High',
          'Critical',
        ],
        required: true,
      },

      nextAction: {
        type: String,
        required: true,
      },
    },

    grounding: {
      grounded: {
        type: Boolean,
        default: false,
      },

      sources: [
        {
          runbookId: String,
          title: String,
          category: String,
          retrievalType: String,
          semanticScore: Number,
          keywordScore: Number,
          matchedKeywords: [String],
        },
      ],
    },

    feedback: {
      type: String,
      enum: [
        'helpful',
        'not_helpful',
      ],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const AIAnalysis = mongoose.model(
  'AIAnalysis',
  aiAnalysisSchema
);

module.exports = AIAnalysis;