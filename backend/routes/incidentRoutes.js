const express = require('express');
const { GoogleGenAI } = require('@google/genai');

const Incident = require('../models/Incident');
const AIAnalysis = require('../models/AIAnalysis');
const authMiddleware = require('../middleware/authMiddleware');
const retrieveRelevantRunbooks = require('../services/runbookRetriever');
const getEmbedding = require('../services/embeddingService');
const cosineSimilarity = require('../services/vectorUtils');

const router = express.Router();

router.use(authMiddleware);

const getUserId = (req) => {
  return req.user.userId || req.user.id || req.user._id;
};

// -----------------------------------
// AI RELIABILITY SETTINGS
// -----------------------------------

const RUNBOOK_RETRIEVAL_TIMEOUT_MS = 30000;
const GEMINI_GENERATION_TIMEOUT_MS = 45000;
const GEMINI_RETRY_DELAY_MS = 1500;
const TOOL_PLANNING_TIMEOUT_MS = 25000;
const SIMILAR_INCIDENT_TIMEOUT_MS = 45000;

const SIMILAR_INCIDENT_THRESHOLD = 0.72;
const SIMILAR_INCIDENT_LIMIT = 5;

// -----------------------------------
// WAIT HELPER
// -----------------------------------

const sleep = (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

// -----------------------------------
// TIMEOUT HELPER
// -----------------------------------

const withTimeout = (
  promise,
  timeoutMilliseconds,
  timeoutMessage
) => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const timeoutError = new Error(timeoutMessage);
      timeoutError.isTimeout = true;
      reject(timeoutError);
    }, timeoutMilliseconds);
  });

  return Promise.race([
    promise,
    timeoutPromise,
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};

// -----------------------------------
// TRANSIENT GEMINI ERROR CHECK
// -----------------------------------

const isTransientGeminiError = (error) => {
  const errorMessage =
    error?.message?.toLowerCase() || '';

  return (
    error?.status === 503 ||
    error?.code === 503 ||
    errorMessage.includes('503') ||
    errorMessage.includes('429') ||
    errorMessage.includes('unavailable') ||
    errorMessage.includes('high demand') ||
    errorMessage.includes('temporarily unavailable') ||
    errorMessage.includes('resource exhausted')
  );
};

// -----------------------------------
// GEMINI GENERATION WITH RETRY
// -----------------------------------

const generateGeminiResponse = async (
  ai,
  modelName,
  prompt
) => {
  const maximumAttempts = 2;

  for (
    let attempt = 1;
    attempt <= maximumAttempts;
    attempt += 1
  ) {
    try {
      console.log(
        `GEMINI GENERATION ATTEMPT ${attempt}/${maximumAttempts}`
      );

      const response =
        await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });

      return response;
    } catch (error) {
      const shouldRetry =
        attempt < maximumAttempts &&
        isTransientGeminiError(error);

      if (!shouldRetry) {
        throw error;
      }

      console.log(
        'Gemini is temporarily unavailable. Retrying once...'
      );

      await sleep(GEMINI_RETRY_DELAY_MS);
    }
  }

  throw new Error(
    'Gemini generation failed after retry.'
  );
};

// -----------------------------------
// VALIDATE AI TOOL CALL
// -----------------------------------

const validateToolCall = (toolCall) => {
  if (
    !toolCall ||
    !toolCall.name ||
    !toolCall.args
  ) {
    return {
      valid: false,
      error: 'Invalid AI tool request.',
    };
  }

  if (
    toolCall.name ===
    'update_incident_status'
  ) {
    const validStatuses = [
      'Open',
      'In Progress',
      'Resolved',
    ];

    if (
      !validStatuses.includes(
        toolCall.args.status
      )
    ) {
      return {
        valid: false,
        error:
          'AI proposed an invalid incident status.',
      };
    }

    return {
      valid: true,
    };
  }

  if (
    toolCall.name ===
    'add_incident_note'
  ) {
    const note =
      typeof toolCall.args.note === 'string'
        ? toolCall.args.note.trim()
        : '';

    if (!note) {
      return {
        valid: false,
        error:
          'AI proposed an empty note.',
      };
    }

    if (note.length > 500) {
      return {
        valid: false,
        error:
          'AI proposed a note that is too long.',
      };
    }

    return {
      valid: true,
    };
  }

  return {
    valid: false,
    error:
      'AI requested an unsupported OpsPilot tool.',
  };
};

// -----------------------------------
// INCIDENT TEXT FOR EMBEDDINGS
// -----------------------------------

const buildIncidentEmbeddingText = (
  incident
) => {
  const recentActivity = (
    incident.activity || []
  )
    .slice(-5)
    .map((item) => item.message)
    .join('\n');

  return `
Incident title:
${incident.title || ''}

Incident description:
${incident.description || ''}

Priority:
${incident.priority || ''}

Recent activity:
${recentActivity || 'No recent activity'}
`;
};

// -----------------------------------
// GET ALL INCIDENTS
// -----------------------------------

router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error:
          'User information not found in token',
      });
    }

    const incidents =
      await Incident.find({
        owner: userId,
      }).sort({
        createdAt: -1,
      });

    return res.json(incidents);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

// -----------------------------------
// AI EVALUATION ANALYTICS
// -----------------------------------

router.get(
  '/analytics/ai-evaluation',
  async (req, res) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          error:
            'User information not found in token',
        });
      }

      const analyses =
        await AIAnalysis.find({
          owner: userId,
        }).select(
          'feedback grounding createdAt'
        );

      const totalAnalyses =
        analyses.length;

      const groundedAnalyses =
        analyses.filter(
          (analysis) =>
            analysis.grounding?.grounded ===
            true
        ).length;

      const helpful =
        analyses.filter(
          (analysis) =>
            analysis.feedback ===
            'helpful'
        ).length;

      const notHelpful =
        analyses.filter(
          (analysis) =>
            analysis.feedback ===
            'not_helpful'
        ).length;

      const noFeedback =
        analyses.filter(
          (analysis) =>
            !analysis.feedback
        ).length;

      const ratedAnalyses =
        helpful + notHelpful;

      const helpfulRate =
        ratedAnalyses === 0
          ? 0
          : Math.round(
              (helpful / ratedAnalyses) *
                100
            );

      const groundingRate =
        totalAnalyses === 0
          ? 0
          : Math.round(
              (groundedAnalyses /
                totalAnalyses) *
                100
            );

      const semanticScores = [];

      analyses.forEach((analysis) => {
        const sources =
          analysis.grounding?.sources || [];

        sources.forEach((source) => {
          if (
            source.retrievalType ===
              'semantic' &&
            typeof source.semanticScore ===
              'number' &&
            Number.isFinite(
              source.semanticScore
            )
          ) {
            semanticScores.push(
              source.semanticScore
            );
          }
        });
      });

      const averageSemanticSimilarity =
        semanticScores.length === 0
          ? null
          : Number(
              (
                semanticScores.reduce(
                  (total, score) =>
                    total + score,
                  0
                ) /
                semanticScores.length
              ).toFixed(3)
            );

      return res.json({
        metrics: {
          totalAnalyses,
          groundedAnalyses,
          groundingRate,

          helpful,
          notHelpful,
          noFeedback,

          ratedAnalyses,
          helpfulRate,

          averageSemanticSimilarity,

          semanticEvaluations:
            semanticScores.length,
        },
      });
    } catch (error) {
      console.error(
        'AI EVALUATION ANALYTICS ERROR:',
        error
      );

      return res.status(500).json({
        error:
          error.message ||
          'Failed to load AI evaluation metrics',
      });
    }
  }
);

// -----------------------------------
// GET AI ANALYSIS HISTORY
// -----------------------------------

router.get(
  '/:id/ai-history',
  async (req, res) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          error:
            'User information not found in token',
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

      const analyses =
        await AIAnalysis.find({
          incident: incident._id,
          owner: userId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(25);

      return res.json({
        analyses,
        total: analyses.length,
      });
    } catch (error) {
      console.error(
        'AI HISTORY ERROR:',
        error
      );

      return res.status(500).json({
        error:
          error.message ||
          'Failed to load AI analysis history',
      });
    }
  }
);

// -----------------------------------
// AI TOOL CALL - PLAN ACTION
// HUMAN APPROVAL REQUIRED
// -----------------------------------

router.post(
  '/:id/ai-tool-plan',
  async (req, res) => {
    console.log(
      'AI TOOL PLANNING ROUTE HIT'
    );

    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          error:
            'User information not found in token',
        });
      }

      const instruction =
        typeof req.body.instruction ===
        'string'
          ? req.body.instruction.trim()
          : '';

      if (!instruction) {
        return res.status(400).json({
          error:
            'Please enter an instruction for OpsPilot AI.',
        });
      }

      if (instruction.length > 500) {
        return res.status(400).json({
          error:
            'AI tool instruction is too long.',
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

      const geminiKey =
        process.env.GEMINI_API_KEY;

      if (!geminiKey) {
        return res.status(500).json({
          error:
            'Gemini API key is not configured',
        });
      }

      const ai =
        new GoogleGenAI({
          apiKey: geminiKey,
        });

      const modelName =
        'gemini-3.6-flash';

      const updateStatusTool = {
        name:
          'update_incident_status',

        description:
          'Change the workflow status of the current OpsPilot incident. Use this only when the user explicitly wants the incident status changed.',

        parametersJsonSchema: {
          type: 'object',

          properties: {
            status: {
              type: 'string',

              enum: [
                'Open',
                'In Progress',
                'Resolved',
              ],

              description:
                'The new incident workflow status.',
            },
          },

          required: ['status'],
        },
      };

      const addNoteTool = {
        name:
          'add_incident_note',

        description:
          'Add an investigation or operational note to the current OpsPilot incident activity timeline. Use this when the user explicitly asks to record or add a note.',

        parametersJsonSchema: {
          type: 'object',

          properties: {
            note: {
              type: 'string',

              description:
                'The incident note to add to the activity timeline.',
            },
          },

          required: ['note'],
        },
      };

      const prompt = `
You are the OpsPilot AI action planner.

Your job is to decide whether the user's instruction
should invoke one of the available OpsPilot tools.

CURRENT INCIDENT

Title:
${incident.title}

Description:
${incident.description}

Priority:
${incident.priority}

Current status:
${incident.status}

USER INSTRUCTION:
${instruction}

IMPORTANT RULES:

- Never invent an action that the user did not request.
- Use update_incident_status only when the user clearly
  wants the workflow status changed.
- Use add_incident_note only when the user clearly wants
  information recorded as an incident note.
- Do not execute anything yourself.
- A human will review and approve the tool call.
- If the user's instruction does not clearly map to one
  of the provided tools, do not call a function.
`;

      const response =
        await withTimeout(
          ai.models.generateContent({
            model: modelName,

            contents: prompt,

            config: {
              tools: [
                {
                  functionDeclarations: [
                    updateStatusTool,
                    addNoteTool,
                  ],
                },
              ],
            },
          }),

          TOOL_PLANNING_TIMEOUT_MS,

          'AI tool planning took too long.'
        );

      const functionCalls =
        response.functionCalls || [];

      if (
        functionCalls.length === 0
      ) {
        return res.status(200).json({
          proposed: false,

          message:
            response.text ||
            'OpsPilot AI did not identify a supported tool action.',
        });
      }

      const functionCall =
        functionCalls[0];

      const toolCall = {
        name: functionCall.name,

        args:
          functionCall.args || {},
      };

      const validation =
        validateToolCall(toolCall);

      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
        });
      }

      let description = '';

      if (
        toolCall.name ===
        'update_incident_status'
      ) {
        description =
          `Change incident status from "${incident.status}" to "${toolCall.args.status}".`;
      }

      if (
        toolCall.name ===
        'add_incident_note'
      ) {
        description =
          `Add incident note: "${toolCall.args.note}".`;
      }

      console.log(
        'AI TOOL PROPOSED:',
        toolCall
      );

      return res.json({
        proposed: true,

        requiresApproval: true,

        proposal: {
          tool: toolCall.name,

          arguments:
            toolCall.args,

          description,

          model: modelName,
        },
      });
    } catch (error) {
      console.error(
        'AI TOOL PLANNING ERROR:',
        error
      );

      if (error?.isTimeout) {
        return res.status(504).json({
          error:
            'OpsPilot AI took too long to plan the action. Please try again.',
        });
      }

      if (
        isTransientGeminiError(error)
      ) {
        return res.status(503).json({
          error:
            'OpsPilot AI is temporarily busy. Please try again in a moment.',
        });
      }

      return res.status(500).json({
        error:
          error.message ||
          'Failed to plan AI tool action',
      });
    }
  }
);

// -----------------------------------
// AI TOOL CALL - EXECUTE APPROVED ACTION
// -----------------------------------

router.post(
  '/:id/ai-tool-execute',
  async (req, res) => {
    console.log(
      'AI TOOL EXECUTION ROUTE HIT'
    );

    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          error:
            'User information not found in token',
        });
      }

      const toolCall = {
        name: req.body.tool,

        args:
          req.body.arguments || {},
      };

      const validation =
        validateToolCall(toolCall);

      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
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

      // UPDATE STATUS TOOL

      if (
        toolCall.name ===
        'update_incident_status'
      ) {
        const newStatus =
          toolCall.args.status;

        const previousStatus =
          incident.status;

        if (
          newStatus ===
          previousStatus
        ) {
          return res.json({
            success: true,

            tool: toolCall.name,

            message:
              `Incident is already ${newStatus}.`,

            incident,
          });
        }

        incident.status =
          newStatus;

        incident.activity.push({
          type: 'status',

          message:
            `Status changed from ${previousStatus} to ${newStatus} by approved AI tool action`,
        });

        await incident.save();

        console.log(
          'AI TOOL EXECUTED: STATUS',
          previousStatus,
          '->',
          newStatus
        );

        return res.json({
          success: true,

          tool: toolCall.name,

          message:
            `Incident status changed to ${newStatus}.`,

          incident,
        });
      }

      // ADD NOTE TOOL

      if (
        toolCall.name ===
        'add_incident_note'
      ) {
        const note =
          toolCall.args.note.trim();

        incident.activity.push({
          type: 'note',
          message: note,
        });

        await incident.save();

        console.log(
          'AI TOOL EXECUTED: NOTE ADDED'
        );

        return res.json({
          success: true,

          tool: toolCall.name,

          message:
            'AI-proposed incident note added successfully.',

          incident,
        });
      }

      return res.status(400).json({
        error:
          'Unsupported AI tool.',
      });
    } catch (error) {
      console.error(
        'AI TOOL EXECUTION ERROR:',
        error
      );

      return res.status(500).json({
        error:
          error.message ||
          'Failed to execute AI tool action',
      });
    }
  }
);

// -----------------------------------
// SIMILAR INCIDENT SEARCH
// -----------------------------------

router.get(
  '/:id/similar',
  async (req, res) => {
    console.log(
      'SIMILAR INCIDENT SEARCH ROUTE HIT'
    );

    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          error:
            'User information not found in token',
        });
      }

      const incident =
        await Incident.findOne({
          _id: req.params.id,
          owner: userId,
        });

      if (!incident) {
        return res.status(404).json({
          error:
            'Incident not found',
        });
      }

      const otherIncidents =
        await Incident.find({
          owner: userId,

          _id: {
            $ne: incident._id,
          },
        });

      if (
        otherIncidents.length === 0
      ) {
        return res.json({
          similarIncidents: [],
          threshold:
            SIMILAR_INCIDENT_THRESHOLD,

          comparedCount: 0,

          message:
            'There are no other incidents to compare yet.',
        });
      }

      const searchSimilarIncidents =
        async () => {
          const currentText =
            buildIncidentEmbeddingText(
              incident
            );

          const currentEmbedding =
            await getEmbedding(
              currentText
            );

          const scoredIncidents = [];

          for (
            const candidate of
            otherIncidents
          ) {
            try {
              const candidateText =
                buildIncidentEmbeddingText(
                  candidate
                );

              const candidateEmbedding =
                await getEmbedding(
                  candidateText
                );

              const similarity =
                cosineSimilarity(
                  currentEmbedding,
                  candidateEmbedding
                );

              scoredIncidents.push({
                _id: candidate._id,

                title:
                  candidate.title,

                description:
                  candidate.description,

                priority:
                  candidate.priority,

                status:
                  candidate.status,

                createdAt:
                  candidate.createdAt,

                updatedAt:
                  candidate.updatedAt,

                similarity:
                  Number(
                    similarity.toFixed(
                      3
                    )
                  ),
              });
            } catch (candidateError) {
              console.error(
                `SIMILAR INCIDENT EMBEDDING FAILED FOR ${candidate._id}:`,
                candidateError.message
              );
            }
          }

          return scoredIncidents
            .filter(
              (candidate) =>
                candidate.similarity >=
                SIMILAR_INCIDENT_THRESHOLD
            )
            .sort(
              (a, b) =>
                b.similarity -
                a.similarity
            )
            .slice(
              0,
              SIMILAR_INCIDENT_LIMIT
            );
        };

      const similarIncidents =
        await withTimeout(
          searchSimilarIncidents(),

          SIMILAR_INCIDENT_TIMEOUT_MS,

          'Similar incident search took too long.'
        );

      return res.json({
        similarIncidents,

        threshold:
          SIMILAR_INCIDENT_THRESHOLD,

        comparedCount:
          otherIncidents.length,
      });
    } catch (error) {
      console.error(
        'SIMILAR INCIDENT SEARCH ERROR:',
        error
      );

      if (error?.isTimeout) {
        return res.status(504).json({
          error:
            'Similar incident search took too long. Please try again.',
        });
      }

      if (
        isTransientGeminiError(error)
      ) {
        return res.status(503).json({
          error:
            'The embedding service is temporarily busy. Please try again in a moment.',
        });
      }

      return res.status(500).json({
        error:
          error.message ||
          'Failed to search for similar incidents',
      });
    }
  }
);

// -----------------------------------
// GET ONE INCIDENT
// -----------------------------------

router.get('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error:
          'User information not found in token',
      });
    }

    const incident =
      await Incident.findOne({
        _id: req.params.id,
        owner: userId,
      });

    if (!incident) {
      return res.status(404).json({
        error:
          'Incident not found',
      });
    }

    return res.json(incident);
  } catch (error) {
    return res.status(500).json({
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
        error:
          'User information not found in token',
      });
    }

    const newIncident =
      new Incident({
        title: req.body.title,

        description:
          req.body.description,

        priority:
          req.body.priority,

        status:
          req.body.status,

        owner: userId,

        activity: [
          {
            type: 'created',

            message:
              'Incident created',
          },
        ],
      });

    const savedIncident =
      await newIncident.save();

    return res
      .status(201)
      .json(savedIncident);
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
});

// -----------------------------------
// AI INCIDENT COPILOT
// -----------------------------------

router.post(
  '/:id/analyze',
  async (req, res) => {
    console.log(
      'GEMINI SEMANTIC RAG ROUTE HIT'
    );

    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          error:
            'User information not found in token',
        });
      }

      const incident =
        await Incident.findOne({
          _id: req.params.id,
          owner: userId,
        });

      if (!incident) {
        return res.status(404).json({
          error:
            'Incident not found',
        });
      }

      const geminiKey =
        process.env.GEMINI_API_KEY;

      if (!geminiKey) {
        return res.status(500).json({
          error:
            'Gemini API key is not configured',
        });
      }

      console.log(
        'RETRIEVING RELEVANT RUNBOOKS'
      );

      const retrievedRunbooks =
        await withTimeout(
          retrieveRelevantRunbooks(
            incident.title,
            incident.description,
            2
          ),

          RUNBOOK_RETRIEVAL_TIMEOUT_MS,

          'Runbook retrieval took too long.'
        );

      if (
        !Array.isArray(
          retrievedRunbooks
        )
      ) {
        throw new Error(
          'Runbook retriever did not return an array'
        );
      }

      console.log(
        `RUNBOOK RETRIEVAL COMPLETE: ${retrievedRunbooks.length} source(s)`
      );

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

      const ai =
        new GoogleGenAI({
          apiKey: geminiKey,
        });

      const modelName =
        'gemini-3.6-flash';

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

      console.log(
        'STARTING GEMINI ANALYSIS'
      );

      const response =
        await withTimeout(
          generateGeminiResponse(
            ai,
            modelName,
            prompt
          ),

          GEMINI_GENERATION_TIMEOUT_MS,

          'AI analysis took too long.'
        );

      const rawText =
        response.text;

      console.log(
        'GEMINI SEMANTIC RAG RESPONSE RECEIVED'
      );

      let analysis;

      try {
        analysis =
          JSON.parse(rawText);
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

      const validPriorities = [
        'Low',
        'Medium',
        'High',
        'Critical',
      ];

      if (
        !analysis.summary ||
        !Array.isArray(
          analysis.rootCauses
        ) ||
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

      const sources =
        retrievedRunbooks.map(
          (runbook) => ({
            id: runbook.id,

            title:
              runbook.title,

            category:
              runbook.category,

            retrievalType:
              runbook.retrievalType ||
              'unknown',

            matchedKeywords:
              runbook.matchedKeywords ||
              [],

            score:
              runbook.score !==
              undefined
                ? runbook.score
                : null,

            semanticScore:
              runbook.semanticScore !==
              undefined
                ? Number(
                    runbook.semanticScore.toFixed(
                      3
                    )
                  )
                : null,
          })
        );

      const savedAnalysis =
        await AIAnalysis.create({
          incident: incident._id,

          owner: userId,

          model: modelName,

          analysis: {
            summary:
              analysis.summary,

            rootCauses:
              analysis.rootCauses,

            recommendedSteps:
              analysis.recommendedSteps,

            suggestedPriority:
              analysis.suggestedPriority,

            nextAction:
              analysis.nextAction,
          },

          grounding: {
            grounded:
              sources.length > 0,

            sources:
              sources.map(
                (source) => ({
                  runbookId:
                    source.id,

                  title:
                    source.title,

                  category:
                    source.category,

                  retrievalType:
                    source.retrievalType,

                  semanticScore:
                    source.semanticScore,

                  keywordScore:
                    source.score,

                  matchedKeywords:
                    source.matchedKeywords ||
                    [],
                })
              ),
          },
        });

      console.log(
        'AI ANALYSIS SAVED:',
        savedAnalysis._id.toString()
      );

      return res.json({
        analysisId:
          savedAnalysis._id,

        analysis,

        grounding: {
          grounded:
            sources.length > 0,

          sources,
        },
      });
    } catch (error) {
      console.error(
        'GEMINI SEMANTIC RAG ERROR:',
        error
      );

      const errorMessage =
        error?.message || '';

      if (error?.isTimeout) {
        return res.status(504).json({
          error:
            'OpsPilot AI took too long to respond. Please try again.',
        });
      }

      if (
        isTransientGeminiError(error)
      ) {
        return res.status(503).json({
          error:
            'OpsPilot AI is temporarily busy due to high demand. Please try again in a moment.',
        });
      }

      return res.status(500).json({
        error:
          errorMessage ||
          'Failed to analyze incident with Gemini',
      });
    }
  }
);

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

      const {
        feedback,
        analysisId,
      } = req.body;

      if (
        feedback !== 'helpful' &&
        feedback !== 'not_helpful'
      ) {
        return res.status(400).json({
          error:
            'Feedback must be helpful or not_helpful',
        });
      }

      if (!analysisId) {
        return res.status(400).json({
          error:
            'Analysis ID is required',
        });
      }

      const incident =
        await Incident.findOne({
          _id: req.params.id,
          owner: userId,
        });

      if (!incident) {
        return res.status(404).json({
          error:
            'Incident not found',
        });
      }

      const analysisRecord =
        await AIAnalysis.findOne({
          _id: analysisId,

          incident:
            incident._id,

          owner: userId,
        });

      if (!analysisRecord) {
        return res.status(404).json({
          error:
            'AI analysis record not found',
        });
      }

      analysisRecord.feedback =
        feedback;

      await analysisRecord.save();

      incident.aiFeedback =
        feedback;

      await incident.save();

      return res.json({
        message:
          'AI feedback saved successfully',

        analysisId:
          analysisRecord._id,

        feedback:
          analysisRecord.feedback,

        analysisRecord,

        incident,
      });
    } catch (error) {
      console.error(
        'AI FEEDBACK ERROR:',
        error
      );

      return res.status(500).json({
        error:
          error.message,
      });
    }
  }
);

// -----------------------------------
// ADD NOTE
// -----------------------------------

router.post(
  '/:id/notes',
  async (req, res) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          error:
            'User information not found in token',
        });
      }

      const note =
        req.body.note;

      if (
        !note ||
        !note.trim()
      ) {
        return res.status(400).json({
          error:
            'Note is required',
        });
      }

      const incident =
        await Incident.findOne({
          _id: req.params.id,
          owner: userId,
        });

      if (!incident) {
        return res.status(404).json({
          error:
            'Incident not found',
        });
      }

      incident.activity.push({
        type: 'note',

        message:
          note.trim(),
      });

      await incident.save();

      return res.json(incident);
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

// -----------------------------------
// UPDATE INCIDENT
// -----------------------------------

router.put(
  '/:id',
  async (req, res) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          error:
            'User information not found in token',
        });
      }

      const incident =
        await Incident.findOne({
          _id: req.params.id,
          owner: userId,
        });

      if (!incident) {
        return res.status(404).json({
          error:
            'Incident not found',
        });
      }

      if (
        req.body.title !==
        undefined
      ) {
        incident.title =
          req.body.title;
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
        req.body.status !==
          undefined &&
        req.body.status !==
          incident.status
      ) {
        incident.status =
          req.body.status;

        incident.activity.push({
          type: 'status',

          message:
            `Status changed to ${req.body.status}`,
        });
      }

      const updatedIncident =
        await incident.save();

      return res.json(
        updatedIncident
      );
    } catch (error) {
      return res.status(400).json({
        error:
          error.message,
      });
    }
  }
);

// -----------------------------------
// DELETE INCIDENT
// -----------------------------------

router.delete(
  '/:id',
  async (req, res) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          error:
            'User information not found in token',
        });
      }

      const deletedIncident =
        await Incident.findOneAndDelete({
          _id: req.params.id,
          owner: userId,
        });

      if (!deletedIncident) {
        return res.status(404).json({
          error:
            'Incident not found',
        });
      }

      await AIAnalysis.deleteMany({
        incident:
          deletedIncident._id,

        owner: userId,
      });

      return res.json({
        message:
          'Incident deleted successfully',

        incident:
          deletedIncident,
      });
    } catch (error) {
      return res.status(500).json({
        error:
          error.message,
      });
    }
  }
);

module.exports = router;