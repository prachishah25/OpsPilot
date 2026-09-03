const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High', 'Critical'],
    },

    status: {
      type: String,
      required: true,
      enum: ['Open', 'In Progress', 'Resolved'],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // AI FEEDBACK
    aiFeedback: {
      type: String,
      enum: ['helpful', 'not_helpful'],
      default: null,
    },

    activity: [
      {
        type: {
          type: String,
          required: true,
          enum: ['created', 'status', 'note'],
        },

        message: {
          type: String,
          required: true,
          trim: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Incident = mongoose.model(
  'Incident',
  incidentSchema
);

module.exports = Incident;