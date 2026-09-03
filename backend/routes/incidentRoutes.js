const express = require('express');
const { GoogleGenAI } = require('@google/genai');

const Incident = require('../models/Incident');
const authMiddleware = require('../middleware/authMiddleware');
const retrieveRelevantRunbooks = require('../services/runbookRetriever');

const router = express.Router();

router.use(authMiddleware);

const getUserId = (req) => {
  return req.user.userId || req.user.id || req.user._id;
};

// -----------------------------------
// GET ALL INCIDENTS
// -----------------------------------

router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: 'User information not found in token',
      });
    }

    const incidents = await Incident.find({
      owner: userId,
    }).sort({
      createdAt: -1,
    });

    res.json(incidents);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// -----------------------------------
// GET ONE INCIDENT
// -----------------------------------

router.get('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: 'User information not found in token',
      });
    }

    const incident = await Incident.findOne({
      _id: req.params.id,
      owner: userId,
    });

    if (!incident) {
      return res.status(404).json({
        error: 'Incident not found',
      });
    }

    res.json(incident);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// -----------------------------------
// CREATE INCIDENT
// -----------------------------------

router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: 'User information not found in token',
      });
    }

    const newIncident = new Incident({
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      status: req.body.status,
      owner: userId,
      activity: [
        {
          type: 'created',
          message: 'Incident created',
        },
      ],
    });

    const savedIncident = await newIncident.save();

    res.status(201).json(savedIncident);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// -----------------------------------
// AI INCIDENT COPILOT + SEMANTIC RAG
// -----------------------------------

router.post('/:id/analyze', async (req, res) => {
  console.log('GEMINI SEMANTIC RAG ROUTE HIT');

  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: 'User information not found in token',
      });
    }

    const incident = await Incident.findOne({
      _id: req.params.id,
      owner: userId,
    });

    if (!incident) {
      return res.status(404).json({
        error: 'Incident not found',
      });
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return res.status(500).json({
        error: 'Gemini API key is not configured',
      });
    }

    // -----------------------------------
    // RETRIEVE RELEVANT RUNBOOKS
    // -----------------------------------

    const retrievedRunbooks =
      await retrieveRelevantRunbooks(
        incident.title,
        incident.description,
        2
      );

    if (!Array.isArray(retrievedRunbooks)) {
      throw new Error(
        'Runbook retriever did not return an array'
      );
    }

    const runbookContext =
      retrievedRunbooks.length > 0
        ? retrievedRunbooks
            .map(
              (runbook, index) => `
SOURCE ${index + 1}

Title:
${runbook.title}

Category:
${runbook.category}

Content:
${runbook.content}
`
            )
            .join('\n')
        : `
No relevant OpsPilot runbook was retrieved.
`;

    // -----------------------------------
    // ACTIVITY HISTORY
    // -----------------------------------

    const activityText =
      incident.activity &&
      incident.activity.length > 0
        ? incident.activity
            .map(
              (item) =>
                `${item.type}: ${item.message}`
            )
            .join('\n')
        : 'No activity recorded yet.';

    // -----------------------------------
    // GEMINI CLIENT
    // -----------------------------------

    const ai = new GoogleGenAI({
      apiKey: geminiKey,
    });

    const prompt = `
You are the AI Incident Copilot inside OpsPilot,
a software incident-management platform.

Analyze this incident using:

1. The incident information.
2. The retrieved OpsPilot runbooks.

GROUNDING RULES:

- Use the retrieved runbooks when relevant.
- Do not invent information.
- Do not claim a root cause is confirmed unless
  the evidence proves it.
- If evidence is insufficient, say so.
- Recommendations should be grounded in the
  retrieved runbooks whenever possible.
- Runbooks are troubleshooting guidance, not proof
  of the root cause.

INCIDENT TITLE:
${incident.title}

INCIDENT DESCRIPTION:
${incident.description}

CURRENT PRIORITY:
${incident.priority}

CURRENT STATUS:
${incident.status}

ACTIVITY HISTORY:
${activityText}

RETRIEVED RUNBOOK KNOWLEDGE:
${runbookContext}

Return ONLY valid JSON.

Do not include markdown.
Do not include a code block.
Do not include text before or after the JSON.

Use exactly this structure:

{
  "summary": "1-3 sentence incident summary",
  "rootCauses": [
    "possible root cause 1",
    "possible root cause 2",
    "possible root cause 3"
  ],
  "recommendedSteps": [
    "troubleshooting step 1",
    "troubleshooting step 2",
    "troubleshooting step 3"
  ],
  "suggestedPriority": "Low, Medium, High, or Critical",
  "nextAction": "one specific next action"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const rawText = response.text;

    console.log(
      'GEMINI SEMANTIC RAG RESPONSE RECEIVED'
    );

    let analysis;

    try {
      analysis = JSON.parse(rawText);
    } catch (parseError) {
      console.error(
        'FAILED TO PARSE GEMINI JSON:',
        rawText
      );

      return res.status(500).json({
        error:
          'AI returned an invalid structured response. Please try again.',
      });
    }

    // -----------------------------------
    // VALIDATE AI RESPONSE
    // -----------------------------------

    const validPriorities = [
      'Low',
      'Medium',
      'High',
      'Critical',
    ];

    if (
      !analysis.summary ||
      !Array.isArray(analysis.rootCauses) ||
      !Array.isArray(
        analysis.recommendedSteps
      ) ||
      !validPriorities.includes(
        analysis.suggestedPriority
      ) ||
      !analysis.nextAction
    ) {
      return res.status(500).json({
        error:
          'AI response did not match the expected structure.',
      });
    }

    // -----------------------------------
    // BUILD SOURCE METADATA
    // -----------------------------------

    const sources = retrievedRunbooks.map(
      (runbook) => ({
        id: runbook.id,
        title: runbook.title,
        category: runbook.category,

        retrievalType:
          runbook.retrievalType || 'unknown',

        matchedKeywords:
          runbook.matchedKeywords || [],

        score:
          runbook.score !== undefined
            ? runbook.score
            : null,

        semanticScore:
          runbook.semanticScore !== undefined
            ? Number(
                runbook.semanticScore.toFixed(
                  3
                )
              )
            : null,
      })
    );

    // -----------------------------------
    // RETURN ANALYSIS + GROUNDING
    // -----------------------------------

    res.json({
      analysis,

      grounding: {
        grounded: sources.length > 0,
        sources,
      },
    });
  } catch (error) {
    console.error(
      'GEMINI SEMANTIC RAG ERROR:',
      error
    );

    res.status(500).json({
      error:
        error.message ||
        'Failed to analyze incident with Gemini',
    });
  }
});

// -----------------------------------
// SAVE AI FEEDBACK
// -----------------------------------

router.post(
  '/:id/ai-feedback',
  async (req, res) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          error:
            'User information not found in token',
        });
      }

      const { feedback } = req.body;

      if (
        feedback !== 'helpful' &&
        feedback !== 'not_helpful'
      ) {
        return res.status(400).json({
          error:
            'Feedback must be helpful or not_helpful',
        });
      }

      const incident =
        await Incident.findOne({
          _id: req.params.id,
          owner: userId,
        });

      if (!incident) {
        return res.status(404).json({
          error: 'Incident not found',
        });
      }

      incident.aiFeedback = feedback;

      await incident.save();

      res.json({
        message:
          'AI feedback saved successfully',
        aiFeedback:
          incident.aiFeedback,
        incident,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  }
);

// -----------------------------------
// ADD NOTE
// -----------------------------------

router.post('/:id/notes', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: 'User information not found in token',
      });
    }

    const note = req.body.note;

    if (!note || !note.trim()) {
      return res.status(400).json({
        error: 'Note is required',
      });
    }

    const incident = await Incident.findOne({
      _id: req.params.id,
      owner: userId,
    });

    if (!incident) {
      return res.status(404).json({
        error: 'Incident not found',
      });
    }

    incident.activity.push({
      type: 'note',
      message: note.trim(),
    });

    await incident.save();

    res.json(incident);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// -----------------------------------
// UPDATE INCIDENT
// -----------------------------------

router.put('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: 'User information not found in token',
      });
    }

    const incident = await Incident.findOne({
      _id: req.params.id,
      owner: userId,
    });

    if (!incident) {
      return res.status(404).json({
        error: 'Incident not found',
      });
    }

    if (req.body.title !== undefined) {
      incident.title = req.body.title;
    }

    if (
      req.body.description !==
      undefined
    ) {
      incident.description =
        req.body.description;
    }

    if (
      req.body.priority !==
      undefined
    ) {
      incident.priority =
        req.body.priority;
    }

    if (
      req.body.status !== undefined &&
      req.body.status !==
        incident.status
    ) {
      incident.status =
        req.body.status;

      incident.activity.push({
        type: 'status',
        message: `Status changed to ${req.body.status}`,
      });
    }

    const updatedIncident =
      await incident.save();

    res.json(updatedIncident);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// -----------------------------------
// DELETE INCIDENT
// -----------------------------------

router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: 'User information not found in token',
      });
    }

    const deletedIncident =
      await Incident.findOneAndDelete({
        _id: req.params.id,
        owner: userId,
      });

    if (!deletedIncident) {
      return res.status(404).json({
        error: 'Incident not found',
      });
    }

    res.json({
      message:
        'Incident deleted successfully',
      incident: deletedIncident,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;