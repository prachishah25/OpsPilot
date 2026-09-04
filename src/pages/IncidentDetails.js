import React, {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useParams,
  useHistory,
} from 'react-router-dom';

const IncidentDetails = ({
  incidents,
  onDeleteIncident,
  onUpdateStatus,
  onUpdateIncident,
}) => {
  const { id } = useParams();
  const history = useHistory();

  const token =
    localStorage.getItem('token');

  const incident =
    incidents.find(
      (currentIncident) =>
        currentIncident._id === id
    );

  // -----------------------------------
  // NOTE STATE
  // -----------------------------------

  const [note, setNote] =
    useState('');

  const [
    isAddingNote,
    setIsAddingNote,
  ] = useState(false);

  const [
    noteError,
    setNoteError,
  ] = useState('');

  // -----------------------------------
  // INCIDENT ACTION STATE
  // -----------------------------------

  const [
    isUpdatingStatus,
    setIsUpdatingStatus,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  // -----------------------------------
  // AI ANALYSIS STATE
  // -----------------------------------

  const [
    aiAnalysis,
    setAiAnalysis,
  ] = useState(null);

  const [
    aiAnalysisId,
    setAiAnalysisId,
  ] = useState(null);

  const [
    aiGrounding,
    setAiGrounding,
  ] = useState(null);

  const [
    isAnalyzing,
    setIsAnalyzing,
  ] = useState(false);

  const [
    aiError,
    setAiError,
  ] = useState('');

  // -----------------------------------
  // AI FEEDBACK STATE
  // -----------------------------------

  const [
    isSavingFeedback,
    setIsSavingFeedback,
  ] = useState(false);

  const [
    feedbackError,
    setFeedbackError,
  ] = useState('');

  const [
    currentAiFeedback,
    setCurrentAiFeedback,
  ] = useState(null);

  // -----------------------------------
  // AI HISTORY STATE
  // -----------------------------------

  const [
    aiHistory,
    setAiHistory,
  ] = useState([]);

  const [
    isHistoryLoading,
    setIsHistoryLoading,
  ] = useState(false);

  const [
    historyError,
    setHistoryError,
  ] = useState('');

  const [
    expandedHistoryId,
    setExpandedHistoryId,
  ] = useState(null);

  // -----------------------------------
  // AI TOOL CALLING STATE
  // -----------------------------------

  const [
    toolInstruction,
    setToolInstruction,
  ] = useState('');

  const [
    toolProposal,
    setToolProposal,
  ] = useState(null);

  const [
    isPlanningTool,
    setIsPlanningTool,
  ] = useState(false);

  const [
    isExecutingTool,
    setIsExecutingTool,
  ] = useState(false);

  const [
    toolError,
    setToolError,
  ] = useState('');

  const [
    toolSuccess,
    setToolSuccess,
  ] = useState('');

  // -----------------------------------
  // SIMILAR INCIDENT STATE
  // -----------------------------------

  const [
    similarIncidents,
    setSimilarIncidents,
  ] = useState([]);

  const [
    isFindingSimilar,
    setIsFindingSimilar,
  ] = useState(false);

  const [
    similarError,
    setSimilarError,
  ] = useState('');

  const [
    similarMessage,
    setSimilarMessage,
  ] = useState('');

  const [
    similarThreshold,
    setSimilarThreshold,
  ] = useState(0.72);

  const [
    comparedCount,
    setComparedCount,
  ] = useState(0);

  // -----------------------------------
  // DATE FORMATTER
  // -----------------------------------

  const formatDate = (
    dateString
  ) => {
    if (!dateString) {
      return 'Not available';
    }

    return new Date(
      dateString
    ).toLocaleString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }
    );
  };

  // -----------------------------------
  // LOAD AI HISTORY
  // -----------------------------------

  const refreshAiHistory =
    async () => {
      try {
        setIsHistoryLoading(true);
        setHistoryError('');

        const response =
          await fetch(
            `http://localhost:5001/api/incidents/${id}/ai-history`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to load AI history'
          );
        }

        setAiHistory(
          Array.isArray(
            data.analyses
          )
            ? data.analyses
            : []
        );
      } catch (error) {
        setHistoryError(
          error.message
        );
      } finally {
        setIsHistoryLoading(false);
      }
    };

  useEffect(() => {
    let cancelled = false;

    const loadHistory =
      async () => {
        if (!token) {
          return;
        }

        try {
          setIsHistoryLoading(
            true
          );

          setHistoryError('');

          const response =
            await fetch(
              `http://localhost:5001/api/incidents/${id}/ai-history`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                'Failed to load AI history'
            );
          }

          if (!cancelled) {
            setAiHistory(
              Array.isArray(
                data.analyses
              )
                ? data.analyses
                : []
            );
          }
        } catch (error) {
          if (!cancelled) {
            setHistoryError(
              error.message
            );
          }
        } finally {
          if (!cancelled) {
            setIsHistoryLoading(
              false
            );
          }
        }
      };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  // -----------------------------------
  // ADD NOTE
  // -----------------------------------

  const handleAddNote =
    async (e) => {
      e.preventDefault();

      if (!note.trim()) {
        setNoteError(
          'Please enter a note.'
        );

        return;
      }

      try {
        setIsAddingNote(true);
        setNoteError('');

        const response =
          await fetch(
            `http://localhost:5001/api/incidents/${id}/notes`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  note:
                    note.trim(),
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to add note'
          );
        }

        onUpdateIncident(data);

        setNote('');
      } catch (error) {
        setNoteError(
          error.message
        );
      } finally {
        setIsAddingNote(false);
      }
    };

  // -----------------------------------
  // STATUS CHANGE
  // -----------------------------------

  const handleStatusChange =
    async (newStatus) => {
      try {
        setIsUpdatingStatus(
          true
        );

        await onUpdateStatus(
          id,
          newStatus
        );
      } finally {
        setIsUpdatingStatus(
          false
        );
      }
    };

  // -----------------------------------
  // DELETE INCIDENT
  // -----------------------------------

  const handleDelete =
    async () => {
      const shouldDelete =
        window.confirm(
          'Are you sure you want to delete this incident?'
        );

      if (!shouldDelete) {
        return;
      }

      try {
        setIsDeleting(true);

        const deleted =
          await onDeleteIncident(id);

        if (deleted) {
          history.push('/');
        }
      } finally {
        setIsDeleting(false);
      }
    };

  // -----------------------------------
  // ANALYZE INCIDENT
  // -----------------------------------

  const handleAnalyzeIncident =
    async () => {
      try {
        setIsAnalyzing(true);

        setAiError('');
        setFeedbackError('');

        setAiAnalysis(null);
        setAiAnalysisId(null);
        setAiGrounding(null);
        setCurrentAiFeedback(null);

        const response =
          await fetch(
            `http://localhost:5001/api/incidents/${id}/analyze`,
            {
              method: 'POST',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to analyze incident'
          );
        }

        setAiAnalysis(
          data.analysis
        );

        setAiAnalysisId(
          data.analysisId ||
            null
        );

        setAiGrounding(
          data.grounding ||
            null
        );

        await refreshAiHistory();
      } catch (error) {
        setAiError(
          error.message
        );
      } finally {
        setIsAnalyzing(false);
      }
    };

  // -----------------------------------
  // AI FEEDBACK
  // -----------------------------------

  const handleAiFeedback =
    async (feedback) => {
      try {
        setIsSavingFeedback(
          true
        );

        setFeedbackError('');

        if (!aiAnalysisId) {
          throw new Error(
            'Analysis ID is missing. Please analyze the incident again.'
          );
        }

        const response =
          await fetch(
            `http://localhost:5001/api/incidents/${id}/ai-feedback`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  feedback,

                  analysisId:
                    aiAnalysisId,
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to save AI feedback'
          );
        }

        setCurrentAiFeedback(
          feedback
        );

        setAiHistory(
          (currentHistory) =>
            currentHistory.map(
              (analysisRecord) =>
                analysisRecord._id ===
                aiAnalysisId
                  ? {
                      ...analysisRecord,
                      feedback,
                    }
                  : analysisRecord
            )
        );

        if (data.incident) {
          onUpdateIncident(
            data.incident
          );
        }
      } catch (error) {
        setFeedbackError(
          error.message
        );
      } finally {
        setIsSavingFeedback(
          false
        );
      }
    };

  // -----------------------------------
  // AI TOOL - PLAN ACTION
  // -----------------------------------

  const handlePlanToolAction =
    async () => {
      if (
        !toolInstruction.trim()
      ) {
        setToolError(
          'Enter an instruction for the AI tool planner.'
        );

        return;
      }

      try {
        setIsPlanningTool(true);

        setToolError('');
        setToolSuccess('');
        setToolProposal(null);

        const response =
          await fetch(
            `http://localhost:5001/api/incidents/${id}/ai-tool-plan`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  instruction:
                    toolInstruction.trim(),
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to plan AI tool action'
          );
        }

        if (!data.proposed) {
          setToolError(
            data.message ||
              'No supported AI tool action was proposed.'
          );

          return;
        }

        setToolProposal(
          data.proposal
        );
      } catch (error) {
        setToolError(
          error.message
        );
      } finally {
        setIsPlanningTool(false);
      }
    };

  // -----------------------------------
  // AI TOOL - EXECUTE
  // -----------------------------------

  const handleExecuteToolAction =
    async () => {
      if (!toolProposal) {
        return;
      }

      try {
        setIsExecutingTool(true);

        setToolError('');
        setToolSuccess('');

        const response =
          await fetch(
            `http://localhost:5001/api/incidents/${id}/ai-tool-execute`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  tool:
                    toolProposal.tool,

                  arguments:
                    toolProposal.arguments,
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to execute AI tool action'
          );
        }

        if (data.incident) {
          onUpdateIncident(
            data.incident
          );
        }

        setToolSuccess(
          data.message ||
            'AI tool action completed.'
        );

        setToolProposal(null);
        setToolInstruction('');
      } catch (error) {
        setToolError(
          error.message
        );
      } finally {
        setIsExecutingTool(false);
      }
    };

  // -----------------------------------
  // FIND SIMILAR INCIDENTS
  // -----------------------------------

  const handleFindSimilarIncidents =
    async () => {
      try {
        setIsFindingSimilar(true);

        setSimilarError('');
        setSimilarMessage('');

        const response =
          await fetch(
            `http://localhost:5001/api/incidents/${id}/similar`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to find similar incidents'
          );
        }

        setSimilarIncidents(
          Array.isArray(
            data.similarIncidents
          )
            ? data.similarIncidents
            : []
        );

        setSimilarThreshold(
          data.threshold ??
            0.72
        );

        setComparedCount(
          data.comparedCount ??
            0
        );

        if (
          data.message
        ) {
          setSimilarMessage(
            data.message
          );
        } else if (
          !data.similarIncidents ||
          data.similarIncidents.length ===
            0
        ) {
          setSimilarMessage(
            `No other incidents met the ${data.threshold ?? 0.72} similarity threshold.`
          );
        }
      } catch (error) {
        setSimilarError(
          error.message
        );
      } finally {
        setIsFindingSimilar(false);
      }
    };

  // -----------------------------------
  // INCIDENT NOT FOUND
  // -----------------------------------

  if (!incident) {
    return (
      <div
        style={{
          maxWidth: '850px',
          margin: '40px auto',
          padding: '0 30px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            backgroundColor:
              'white',

            border:
              '1px solid #d9dee8',

            borderRadius:
              '10px',

            padding: '40px',
          }}
        >
          <h2>
            Incident not found
          </h2>

          <p
            style={{
              color: '#64748b',
            }}
          >
            This incident may
            have been deleted or
            is unavailable.
          </p>

          <button
            onClick={() =>
              history.push('/')
            }
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------
  // DISPLAY HELPERS
  // -----------------------------------

  const priorityColor =
    incident.priority ===
    'Critical'
      ? '#dc2626'
      : incident.priority ===
        'High'
      ? '#ef4444'
      : incident.priority ===
        'Medium'
      ? '#b7791f'
      : '#16a34a';

  const statusColor =
    incident.status ===
    'Resolved'
      ? '#16a34a'
      : incident.status ===
        'In Progress'
      ? '#2563eb'
      : '#1554c0';

  const activity = [
    ...(incident.activity || []),
  ].sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  );

  const visibleAiHistory =
    aiHistory.filter(
      (analysisRecord) =>
        analysisRecord._id !==
        aiAnalysisId
    );

  const toolDisplayName =
    toolProposal?.tool ===
    'update_incident_status'
      ? 'Update Incident Status'
      : toolProposal?.tool ===
        'add_incident_note'
      ? 'Add Incident Note'
      : 'OpsPilot Tool';

  const cardStyle = {
    backgroundColor: 'white',
    border:
      '1px solid #d9dee8',
    borderRadius: '10px',
    padding: '24px',
    marginBottom: '20px',
  };

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding:
          '0 30px 50px',
        boxSizing:
          'border-box',
      }}
    >
      {/* BACK */}

      <button
        onClick={() =>
          history.push('/')
        }
        style={{
          backgroundColor:
            'transparent',

          border: 'none',

          color: '#2563eb',

          fontWeight: '600',

          cursor: 'pointer',

          padding: '10px 0',

          marginBottom:
            '10px',
        }}
      >
        ← Back to Dashboard
      </button>

      {/* INCIDENT HEADER */}

      <div style={cardStyle}>
        <div
          style={{
            display: 'flex',

            justifyContent:
              'space-between',

            gap: '20px',

            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              flex: '1',
              minWidth: '250px',
            }}
          >
            <div
              style={{
                color: '#64748b',

                fontSize: '13px',

                fontWeight: '600',

                textTransform:
                  'uppercase',

                marginBottom: '8px',
              }}
            >
              Incident
            </div>

            <h1
              style={{
                margin:
                  '0 0 12px',

                color: '#111827',

                fontSize: '30px',
              }}
            >
              {incident.title}
            </h1>

            <p
              style={{
                margin: '0',

                color: '#4b5563',

                fontSize: '16px',

                lineHeight: '1.7',
              }}
            >
              {
                incident.description
              }
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                padding:
                  '7px 12px',

                borderRadius:
                  '20px',

                border:
                  `1px solid ${priorityColor}`,

                color:
                  priorityColor,

                fontWeight: '700',
              }}
            >
              {
                incident.priority
              }
            </span>

            <span
              style={{
                padding:
                  '7px 12px',

                borderRadius:
                  '20px',

                border:
                  `1px solid ${statusColor}`,

                color:
                  statusColor,

                fontWeight: '700',
              }}
            >
              {
                incident.status
              }
            </span>
          </div>
        </div>
      </div>

      {/* AI COPILOT */}

      <div
        style={{
          ...cardStyle,

          backgroundColor:
            '#f8faff',

          border:
            '1px solid #c7d7fe',
        }}
      >
        <div
          style={{
            display: 'flex',

            justifyContent:
              'space-between',

            alignItems:
              'flex-start',

            gap: '20px',

            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2
              style={{
                margin:
                  '0 0 6px',
              }}
            >
              ✦ AI Incident
              Copilot
            </h2>

            <p
              style={{
                color: '#64748b',
                margin: '0',
              }}
            >
              Generate grounded
              troubleshooting
              recommendations using
              OpsPilot runbooks.
            </p>
          </div>

          <button
            onClick={
              handleAnalyzeIncident
            }
            disabled={
              isAnalyzing
            }
            style={{
              backgroundColor:
                isAnalyzing
                  ? '#94a3b8'
                  : '#2563eb',

              color: 'white',

              border: 'none',

              borderRadius: '7px',

              padding:
                '11px 18px',

              fontWeight: '600',

              cursor:
                isAnalyzing
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {isAnalyzing
              ? 'Analyzing...'
              : '✦ Analyze Incident'}
          </button>
        </div>

        {isAnalyzing && (
          <div
            style={{
              marginTop: '20px',

              padding: '16px',

              backgroundColor:
                'white',

              textAlign: 'center',

              borderRadius: '8px',
            }}
          >
            OpsPilot AI is
            retrieving runbooks and
            analyzing the incident...
          </div>
        )}

        {aiError && (
          <div
            style={{
              marginTop: '18px',

              padding: '14px',

              backgroundColor:
                '#fef2f2',

              border:
                '1px solid #fecaca',

              color: '#b91c1c',

              borderRadius: '7px',
            }}
          >
            <strong>
              AI analysis failed:
            </strong>{' '}
            {aiError}
          </div>
        )}

        {aiAnalysis &&
          !isAnalyzing && (
            <div
              style={{
                marginTop: '22px',

                padding: '22px',

                backgroundColor:
                  'white',

                border:
                  '1px solid #dbeafe',

                borderRadius:
                  '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',

                  justifyContent:
                    'space-between',

                  gap: '10px',

                  flexWrap: 'wrap',

                  marginBottom:
                    '20px',
                }}
              >
                <h3
                  style={{
                    margin: '0',
                  }}
                >
                  AI Analysis
                </h3>

                <span
                  style={{
                    color: '#2563eb',

                    fontSize: '12px',

                    fontWeight: '700',
                  }}
                >
                  AI GENERATED
                </span>
              </div>

              {aiGrounding && (
                <div
                  style={{
                    padding: '15px',

                    marginBottom:
                      '20px',

                    backgroundColor:
                      aiGrounding.grounded
                        ? '#f0fdf4'
                        : '#f8fafc',

                    borderRadius:
                      '8px',
                  }}
                >
                  <strong>
                    {aiGrounding.grounded
                      ? '✓ Grounded with OpsPilot Runbooks'
                      : 'No relevant runbook retrieved'}
                  </strong>

                  {aiGrounding.sources?.map(
                    (
                      source,
                      index
                    ) => (
                      <div
                        key={
                          source.id ||
                          index
                        }
                        style={{
                          marginTop:
                            '10px',

                          fontSize:
                            '13px',

                          color:
                            '#475569',
                        }}
                      >
                        Source{' '}
                        {index + 1}:{' '}
                        {
                          source.title
                        }

                        {source.semanticScore !==
                          null &&
                          source.semanticScore !==
                            undefined &&
                          ` (${source.semanticScore})`}
                      </div>
                    )
                  )}
                </div>
              )}

              <h4>
                Summary
              </h4>

              <p
                style={{
                  lineHeight: '1.6',
                }}
              >
                {
                  aiAnalysis.summary
                }
              </p>

              <h4>
                Possible Root
                Causes
              </h4>

              {aiAnalysis.rootCauses?.map(
                (
                  cause,
                  index
                ) => (
                  <p
                    key={index}
                  >
                    • {cause}
                  </p>
                )
              )}

              <h4>
                Recommended Steps
              </h4>

              {aiAnalysis.recommendedSteps?.map(
                (
                  step,
                  index
                ) => (
                  <p
                    key={index}
                  >
                    {index + 1}.{' '}
                    {step}
                  </p>
                )
              )}

              <div
                style={{
                  marginTop: '20px',

                  padding: '15px',

                  backgroundColor:
                    '#f8fafc',

                  borderRadius: '8px',
                }}
              >
                <strong>
                  Suggested Priority:
                </strong>{' '}
                {
                  aiAnalysis.suggestedPriority
                }

                <br />
                <br />

                <strong>
                  Next Action:
                </strong>{' '}
                {
                  aiAnalysis.nextAction
                }
              </div>

              {/* AI FEEDBACK */}

              <div
                style={{
                  marginTop: '20px',

                  paddingTop: '18px',

                  borderTop:
                    '1px solid #e5e7eb',
                }}
              >
                <strong>
                  Was this analysis
                  helpful?
                </strong>

                <div
                  style={{
                    display: 'flex',

                    gap: '10px',

                    marginTop: '12px',

                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={() =>
                      handleAiFeedback(
                        'helpful'
                      )
                    }
                    disabled={
                      isSavingFeedback
                    }
                    style={{
                      padding:
                        '9px 14px',

                      borderRadius:
                        '7px',

                      border:
                        currentAiFeedback ===
                        'helpful'
                          ? '1px solid #16a34a'
                          : '1px solid #cbd5e1',

                      backgroundColor:
                        currentAiFeedback ===
                        'helpful'
                          ? '#f0fdf4'
                          : 'white',

                      cursor: 'pointer',
                    }}
                  >
                    👍 Helpful
                  </button>

                  <button
                    onClick={() =>
                      handleAiFeedback(
                        'not_helpful'
                      )
                    }
                    disabled={
                      isSavingFeedback
                    }
                    style={{
                      padding:
                        '9px 14px',

                      borderRadius:
                        '7px',

                      border:
                        currentAiFeedback ===
                        'not_helpful'
                          ? '1px solid #dc2626'
                          : '1px solid #cbd5e1',

                      backgroundColor:
                        currentAiFeedback ===
                        'not_helpful'
                          ? '#fef2f2'
                          : 'white',

                      cursor: 'pointer',
                    }}
                  >
                    👎 Not Helpful
                  </button>
                </div>

                {currentAiFeedback &&
                  !isSavingFeedback && (
                    <p
                      style={{
                        color: '#16a34a',

                        fontWeight:
                          '600',
                      }}
                    >
                      ✓ Feedback saved
                    </p>
                  )}

                {feedbackError && (
                  <p
                    style={{
                      color: '#dc2626',
                    }}
                  >
                    {feedbackError}
                  </p>
                )}
              </div>
            </div>
          )}
      </div>

      {/* AI TOOL ACTIONS */}

      <div
        style={{
          ...cardStyle,

          border:
            '1px solid #c7d7fe',
        }}
      >
        <div
          style={{
            display: 'flex',

            justifyContent:
              'space-between',

            gap: '15px',

            flexWrap: 'wrap',

            marginBottom:
              '14px',
          }}
        >
          <div>
            <h3
              style={{
                margin:
                  '0 0 6px',
              }}
            >
              ⚙ AI Tool Actions
            </h3>

            <p
              style={{
                margin: '0',

                color: '#64748b',

                fontSize: '14px',

                lineHeight: '1.6',
              }}
            >
              Ask Gemini to select
              an OpsPilot tool.
              Nothing is changed
              until you approve the
              proposed action.
            </p>
          </div>

          <span
            style={{
              backgroundColor:
                '#fef3c7',

              color: '#92400e',

              padding:
                '6px 10px',

              borderRadius:
                '20px',

              fontSize: '12px',

              fontWeight: '700',

              height:
                'fit-content',
            }}
          >
            HUMAN APPROVAL
          </span>
        </div>

        <textarea
          value={toolInstruction}
          onChange={(e) => {
            setToolInstruction(
              e.target.value
            );

            setToolError('');
            setToolSuccess('');
            setToolProposal(null);
          }}
          placeholder="Examples: Mark this incident in progress OR Add a note that the database service was restarted."
          rows="3"
          style={{
            width: '100%',

            boxSizing:
              'border-box',

            padding: '12px',

            border:
              '1px solid #cbd5e1',

            borderRadius: '7px',

            fontSize: '14px',

            fontFamily:
              'inherit',

            resize: 'vertical',
          }}
        />

        <button
          onClick={
            handlePlanToolAction
          }
          disabled={
            isPlanningTool ||
            isExecutingTool
          }
          style={{
            marginTop: '12px',

            backgroundColor:
              isPlanningTool
                ? '#94a3b8'
                : '#2563eb',

            color: 'white',

            border: 'none',

            borderRadius: '7px',

            padding:
              '10px 18px',

            cursor:
              isPlanningTool
                ? 'not-allowed'
                : 'pointer',

            fontWeight: '600',
          }}
        >
          {isPlanningTool
            ? 'Planning Action...'
            : '✦ Plan Tool Action'}
        </button>

        {toolProposal && (
          <div
            style={{
              marginTop: '18px',

              padding: '18px',

              backgroundColor:
                '#fffbeb',

              border:
                '1px solid #fde68a',

              borderRadius: '9px',
            }}
          >
            <strong
              style={{
                color: '#92400e',
              }}
            >
              Approval Required
            </strong>

            <p>
              <strong>
                Tool:
              </strong>{' '}
              {toolDisplayName}
            </p>

            <p
              style={{
                color: '#475569',
              }}
            >
              {
                toolProposal.description
              }
            </p>

            <div
              style={{
                display: 'flex',

                gap: '10px',

                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={
                  handleExecuteToolAction
                }
                disabled={
                  isExecutingTool
                }
                style={{
                  backgroundColor:
                    '#16a34a',

                  color: 'white',

                  border: 'none',

                  padding:
                    '10px 16px',

                  borderRadius:
                    '7px',

                  cursor: 'pointer',

                  fontWeight: '600',
                }}
              >
                {isExecutingTool
                  ? 'Executing...'
                  : '✓ Approve & Execute'}
              </button>

              <button
                onClick={() => {
                  setToolProposal(
                    null
                  );

                  setToolError('');
                }}
                disabled={
                  isExecutingTool
                }
                style={{
                  backgroundColor:
                    'white',

                  border:
                    '1px solid #cbd5e1',

                  padding:
                    '10px 16px',

                  borderRadius:
                    '7px',

                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {toolSuccess && (
          <div
            style={{
              marginTop: '15px',

              backgroundColor:
                '#f0fdf4',

              border:
                '1px solid #bbf7d0',

              color: '#15803d',

              borderRadius: '7px',

              padding: '12px',

              fontWeight: '600',
            }}
          >
            ✓ {toolSuccess}
          </div>
        )}

        {toolError && (
          <div
            style={{
              marginTop: '15px',

              backgroundColor:
                '#fef2f2',

              border:
                '1px solid #fecaca',

              color: '#b91c1c',

              borderRadius: '7px',

              padding: '12px',
            }}
          >
            {toolError}
          </div>
        )}
      </div>

      {/* SIMILAR INCIDENTS */}

      <div
        style={{
          ...cardStyle,

          backgroundColor:
            '#fafbff',

          border:
            '1px solid #c7d7fe',
        }}
      >
        <div
          style={{
            display: 'flex',

            justifyContent:
              'space-between',

            alignItems:
              'flex-start',

            gap: '15px',

            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3
              style={{
                margin:
                  '0 0 6px',

                color: '#111827',
              }}
            >
              ◎ Similar Incidents
            </h3>

            <p
              style={{
                margin: '0',

                color: '#64748b',

                fontSize: '14px',

                lineHeight: '1.6',
              }}
            >
              Use semantic
              embeddings to find
              previous incidents
              with similar symptoms
              and context.
            </p>
          </div>

          <button
            onClick={
              handleFindSimilarIncidents
            }
            disabled={
              isFindingSimilar
            }
            style={{
              backgroundColor:
                isFindingSimilar
                  ? '#94a3b8'
                  : '#2563eb',

              color: 'white',

              border: 'none',

              borderRadius: '7px',

              padding:
                '10px 16px',

              fontWeight: '600',

              cursor:
                isFindingSimilar
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {isFindingSimilar
              ? 'Searching...'
              : '◎ Find Similar Incidents'}
          </button>
        </div>

        {isFindingSimilar && (
          <div
            style={{
              marginTop: '18px',

              padding: '15px',

              backgroundColor:
                'white',

              borderRadius: '8px',

              color: '#64748b',

              textAlign: 'center',
            }}
          >
            Creating embeddings
            and comparing
            incidents...
          </div>
        )}

        {similarError && (
          <div
            style={{
              marginTop: '18px',

              padding: '12px',

              backgroundColor:
                '#fef2f2',

              color: '#b91c1c',

              border:
                '1px solid #fecaca',

              borderRadius: '7px',
            }}
          >
            {similarError}
          </div>
        )}

        {similarMessage &&
          !isFindingSimilar &&
          !similarError && (
            <div
              style={{
                marginTop: '18px',

                padding: '14px',

                backgroundColor:
                  'white',

                color: '#64748b',

                border:
                  '1px solid #e2e8f0',

                borderRadius: '7px',
              }}
            >
              {similarMessage}
            </div>
          )}

        {similarIncidents.length >
          0 && (
          <div
            style={{
              marginTop: '20px',
            }}
          >
            <div
              style={{
                color: '#64748b',

                fontSize: '12px',

                marginBottom:
                  '12px',
              }}
            >
              Compared{' '}
              {comparedCount}{' '}
              {comparedCount === 1
                ? 'incident'
                : 'incidents'}
              . Minimum similarity:{' '}
              {Math.round(
                similarThreshold *
                  100
              )}
              %.
            </div>

            {similarIncidents.map(
              (
                similarIncident,
                index
              ) => {
                const percent =
                  Math.round(
                    similarIncident.similarity *
                      100
                  );

                return (
                  <div
                    key={
                      similarIncident._id
                    }
                    style={{
                      backgroundColor:
                        'white',

                      border:
                        '1px solid #dbeafe',

                      borderRadius:
                        '9px',

                      padding: '17px',

                      marginBottom:
                        index ===
                        similarIncidents.length -
                          1
                          ? '0'
                          : '12px',
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',

                        justifyContent:
                          'space-between',

                        gap: '12px',

                        flexWrap:
                          'wrap',
                      }}
                    >
                      <div
                        style={{
                          flex: '1',

                          minWidth:
                            '220px',
                        }}
                      >
                        <h4
                          style={{
                            margin:
                              '0 0 7px',

                            color:
                              '#111827',
                          }}
                        >
                          {
                            similarIncident.title
                          }
                        </h4>

                        <p
                          style={{
                            margin:
                              '0 0 10px',

                            color:
                              '#475569',

                            fontSize:
                              '14px',

                            lineHeight:
                              '1.6',
                          }}
                        >
                          {
                            similarIncident.description
                          }
                        </p>
                      </div>

                      <div
                        style={{
                          backgroundColor:
                            '#eff6ff',

                          color:
                            '#2563eb',

                          borderRadius:
                            '20px',

                          padding:
                            '6px 10px',

                          fontSize:
                            '12px',

                          fontWeight:
                            '700',

                          height:
                            'fit-content',
                        }}
                      >
                        {percent}%
                        similar
                      </div>
                    </div>

                    <div
                      style={{
                        display:
                          'flex',

                        gap: '8px',

                        flexWrap:
                          'wrap',

                        marginBottom:
                          '11px',
                      }}
                    >
                      <span
                        style={{
                          color:
                            '#64748b',

                          fontSize:
                            '12px',
                        }}
                      >
                        Priority:{' '}

                        <strong>
                          {
                            similarIncident.priority
                          }
                        </strong>
                      </span>

                      <span
                        style={{
                          color:
                            '#64748b',

                          fontSize:
                            '12px',
                        }}
                      >
                        Status:{' '}

                        <strong>
                          {
                            similarIncident.status
                          }
                        </strong>
                      </span>
                    </div>

                    <Link
                      to={`/incidents/${similarIncident._id}`}
                      style={{
                        color:
                          '#2563eb',

                        textDecoration:
                          'none',

                        fontWeight:
                          '600',

                        fontSize:
                          '13px',
                      }}
                    >
                      View Incident →
                    </Link>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* AI ANALYSIS HISTORY */}

      <div style={cardStyle}>
        <div
          style={{
            display: 'flex',

            justifyContent:
              'space-between',

            gap: '10px',

            flexWrap: 'wrap',

            marginBottom:
              '18px',
          }}
        >
          <div>
            <h3
              style={{
                margin:
                  '0 0 5px',
              }}
            >
              AI Analysis History
            </h3>

            <span
              style={{
                color: '#64748b',

                fontSize: '13px',
              }}
            >
              Previous AI
              analyses and
              feedback.
            </span>
          </div>

          <strong>
            {aiHistory.length}
          </strong>
        </div>

        {isHistoryLoading && (
          <p>
            Loading AI analysis
            history...
          </p>
        )}

        {historyError && (
          <p
            style={{
              color: '#dc2626',
            }}
          >
            {historyError}
          </p>
        )}

        {!isHistoryLoading &&
          !historyError &&
          visibleAiHistory.length ===
            0 && (
            <p
              style={{
                color: '#64748b',
              }}
            >
              No previous AI
              analyses yet.
            </p>
          )}

        {visibleAiHistory.map(
          (record, index) => {
            const expanded =
              expandedHistoryId ===
              record._id;

            const source =
              record.grounding
                ?.sources?.[0];

            return (
              <div
                key={record._id}
                style={{
                  border:
                    '1px solid #e2e8f0',

                  borderRadius:
                    '9px',

                  padding: '16px',

                  marginBottom:
                    index ===
                    visibleAiHistory.length -
                      1
                      ? '0'
                      : '12px',

                  backgroundColor:
                    '#f8fafc',
                }}
              >
                <div
                  style={{
                    display:
                      'flex',

                    justifyContent:
                      'space-between',

                    gap: '10px',

                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <strong>
                      AI Analysis
                    </strong>

                    <div
                      style={{
                        fontSize:
                          '12px',

                        color:
                          '#64748b',

                        marginTop:
                          '4px',
                      }}
                    >
                      {formatDate(
                        record.createdAt
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize:
                        '13px',
                    }}
                  >
                    {record.feedback ===
                      'helpful' &&
                      '👍 Helpful'}

                    {record.feedback ===
                      'not_helpful' &&
                      '👎 Not Helpful'}

                    {!record.feedback &&
                      'No feedback'}
                  </div>
                </div>

                <p
                  style={{
                    lineHeight: '1.6',
                  }}
                >
                  {
                    record.analysis
                      ?.summary
                  }
                </p>

                <div
                  style={{
                    color: '#64748b',

                    fontSize: '12px',

                    lineHeight: '1.7',
                  }}
                >
                  <div>
                    <strong>
                      Model:
                    </strong>{' '}
                    {record.model}
                  </div>

                  <div>
                    <strong>
                      Suggested
                      priority:
                    </strong>{' '}
                    {
                      record.analysis
                        ?.suggestedPriority
                    }
                  </div>

                  {source && (
                    <div>
                      <strong>
                        Grounded
                        source:
                      </strong>{' '}
                      {
                        source.title
                      }

                      {source.semanticScore !==
                        null &&
                        source.semanticScore !==
                          undefined &&
                        ` (${source.semanticScore})`}
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    setExpandedHistoryId(
                      expanded
                        ? null
                        : record._id
                    )
                  }
                  style={{
                    marginTop:
                      '10px',

                    border: 'none',

                    backgroundColor:
                      'transparent',

                    color: '#2563eb',

                    padding: '0',

                    cursor: 'pointer',

                    fontWeight: '600',
                  }}
                >
                  {expanded
                    ? 'Hide details ▲'
                    : 'View details ▼'}
                </button>

                {expanded && (
                  <div
                    style={{
                      marginTop:
                        '15px',

                      paddingTop:
                        '15px',

                      borderTop:
                        '1px solid #e2e8f0',
                    }}
                  >
                    <strong>
                      Possible Root
                      Causes
                    </strong>

                    {record.analysis?.rootCauses?.map(
                      (
                        cause,
                        causeIndex
                      ) => (
                        <p
                          key={
                            causeIndex
                          }
                        >
                          • {cause}
                        </p>
                      )
                    )}

                    <strong>
                      Recommended
                      Steps
                    </strong>

                    {record.analysis?.recommendedSteps?.map(
                      (
                        step,
                        stepIndex
                      ) => (
                        <p
                          key={
                            stepIndex
                          }
                        >
                          {stepIndex +
                            1}
                          . {step}
                        </p>
                      )
                    )}

                    <div>
                      <strong>
                        Next Action:
                      </strong>{' '}
                      {
                        record.analysis
                          ?.nextAction
                      }
                    </div>
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>

      {/* INFORMATION + ACTIONS */}

      <div
        style={{
          display: 'flex',

          gap: '20px',

          flexWrap: 'wrap',

          marginBottom: '20px',
        }}
      >
        <div
          style={{
            ...cardStyle,

            flex: '1',

            minWidth: '280px',

            marginBottom: '0',
          }}
        >
          <h3>
            Incident Information
          </h3>

          <p>
            <strong>
              Priority:
            </strong>{' '}

            <span
              style={{
                color:
                  priorityColor,
              }}
            >
              {
                incident.priority
              }
            </span>
          </p>

          <p>
            <strong>
              Status:
            </strong>{' '}

            <span
              style={{
                color: statusColor,
              }}
            >
              {
                incident.status
              }
            </span>
          </p>

          <p>
            <strong>
              Created:
            </strong>{' '}
            {formatDate(
              incident.createdAt
            )}
          </p>

          <p>
            <strong>
              Last Updated:
            </strong>{' '}
            {formatDate(
              incident.updatedAt
            )}
          </p>
        </div>

        <div
          style={{
            ...cardStyle,

            flex: '1',

            minWidth: '280px',

            marginBottom: '0',
          }}
        >
          <h3>
            Incident Actions
          </h3>

          <div
            style={{
              display: 'flex',

              flexDirection:
                'column',

              gap: '10px',
            }}
          >
            {incident.status ===
              'Open' && (
              <button
                disabled={
                  isUpdatingStatus
                }
                onClick={() =>
                  handleStatusChange(
                    'In Progress'
                  )
                }
              >
                Start Progress
              </button>
            )}

            {incident.status !==
              'Resolved' && (
              <button
                disabled={
                  isUpdatingStatus
                }
                onClick={() =>
                  handleStatusChange(
                    'Resolved'
                  )
                }
              >
                ✓ Mark Resolved
              </button>
            )}

            {incident.status ===
              'Resolved' && (
              <button
                disabled={
                  isUpdatingStatus
                }
                onClick={() =>
                  handleStatusChange(
                    'Open'
                  )
                }
              >
                Reopen Incident
              </button>
            )}

            <button
              disabled={
                isDeleting
              }
              onClick={
                handleDelete
              }
              style={{
                color: '#dc2626',
              }}
            >
              {isDeleting
                ? 'Deleting...'
                : '🗑 Delete Incident'}
            </button>
          </div>
        </div>
      </div>

      {/* ADD NOTE */}

      <div style={cardStyle}>
        <h3>
          Add Note
        </h3>

        <p
          style={{
            color: '#64748b',
          }}
        >
          Record investigation
          findings,
          troubleshooting steps,
          or important updates.
        </p>

        <form
          onSubmit={
            handleAddNote
          }
        >
          <textarea
            value={note}
            onChange={(e) => {
              setNote(
                e.target.value
              );

              setNoteError('');
            }}
            placeholder="Example: Investigating database connection pool..."
            rows="4"
            style={{
              width: '100%',

              boxSizing:
                'border-box',

              resize: 'vertical',

              padding: '12px',

              border:
                '1px solid #cbd5e1',

              borderRadius: '7px',

              fontSize: '14px',
            }}
          />

          {noteError && (
            <p
              style={{
                color: '#dc2626',
              }}
            >
              {noteError}
            </p>
          )}

          <button
            type="submit"
            disabled={
              isAddingNote
            }
            style={{
              marginTop: '12px',

              padding:
                '10px 18px',

              backgroundColor:
                isAddingNote
                  ? '#94a3b8'
                  : '#2563eb',

              color: 'white',

              border: 'none',

              borderRadius: '7px',

              cursor:
                isAddingNote
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {isAddingNote
              ? 'Adding...'
              : 'Add Note'}
          </button>
        </form>
      </div>

      {/* ACTIVITY TIMELINE */}

      <div style={cardStyle}>
        <div
          style={{
            display: 'flex',

            justifyContent:
              'space-between',

            marginBottom: '20px',

            gap: '10px',

            flexWrap: 'wrap',
          }}
        >
          <h3
            style={{
              margin: '0',
            }}
          >
            Activity Timeline
          </h3>

          <span
            style={{
              color: '#64748b',
              fontSize: '13px',
            }}
          >
            {activity.length}{' '}

            {activity.length === 1
              ? 'event'
              : 'events'}
          </span>
        </div>

        {activity.length ===
        0 ? (
          <p
            style={{
              color: '#64748b',
            }}
          >
            No activity has been
            recorded yet.
          </p>
        ) : (
          activity.map(
            (
              activityItem,
              index
            ) => (
              <div
                key={
                  activityItem._id ||
                  `${activityItem.createdAt}-${index}`
                }
                style={{
                  borderLeft:
                    activityItem.type ===
                    'note'
                      ? '3px solid #2563eb'
                      : activityItem.type ===
                        'status'
                      ? '3px solid #16a34a'
                      : '3px solid #64748b',

                  paddingLeft:
                    '14px',

                  marginBottom:
                    '18px',
                }}
              >
                <div
                  style={{
                    color: '#374151',

                    fontWeight: '600',
                  }}
                >
                  {
                    activityItem.message
                  }
                </div>

                <div
                  style={{
                    color: '#94a3b8',

                    fontSize: '12px',

                    marginTop: '4px',
                  }}
                >
                  {formatDate(
                    activityItem.createdAt
                  )}
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
};

export default IncidentDetails;