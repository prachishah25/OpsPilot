import React, { useState } from 'react';
import {
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

  const [note, setNote] = useState('');
  const [isAddingNote, setIsAddingNote] =
    useState(false);
  const [noteError, setNoteError] = useState('');

  const [isUpdatingStatus, setIsUpdatingStatus] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  // AI COPILOT STATE
  const [aiAnalysis, setAiAnalysis] =
    useState(null);
  const [aiGrounding, setAiGrounding] =
    useState(null);
  const [isAnalyzing, setIsAnalyzing] =
    useState(false);
  const [aiError, setAiError] = useState('');

  // AI FEEDBACK STATE
  const [isSavingFeedback, setIsSavingFeedback] =
    useState(false);
  const [feedbackError, setFeedbackError] =
    useState('');

  const token = localStorage.getItem('token');

  const incident = incidents.find(
    (currentIncident) => currentIncident._id === id
  );

  // -----------------------------------
  // DATE FORMATTER
  // -----------------------------------

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Not available';
    }

    return new Date(dateString).toLocaleString(
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
  // ADD NOTE
  // -----------------------------------

  const handleAddNote = async (e) => {
    e.preventDefault();

    if (!note.trim()) {
      setNoteError('Please enter a note.');
      return;
    }

    try {
      setIsAddingNote(true);
      setNoteError('');

      const response = await fetch(
        `http://localhost:5001/api/incidents/${id}/notes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            note: note.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to add note'
        );
      }

      onUpdateIncident(data);
      setNote('');
    } catch (error) {
      setNoteError(error.message);
    } finally {
      setIsAddingNote(false);
    }
  };

  // -----------------------------------
  // STATUS CHANGE
  // -----------------------------------

  const handleStatusChange = async (newStatus) => {
    try {
      setIsUpdatingStatus(true);

      await onUpdateStatus(id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // -----------------------------------
  // DELETE INCIDENT
  // -----------------------------------

  const handleDelete = async () => {
    const shouldDelete = window.confirm(
      'Are you sure you want to delete this incident?'
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setIsDeleting(true);

      const deleted = await onDeleteIncident(id);

      if (deleted) {
        history.push('/');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // -----------------------------------
  // AI INCIDENT COPILOT
  // -----------------------------------

  const handleAnalyzeIncident = async () => {
    try {
      setIsAnalyzing(true);
      setAiError('');
      setAiAnalysis(null);
      setAiGrounding(null);

      const response = await fetch(
        `http://localhost:5001/api/incidents/${id}/analyze`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to analyze incident'
        );
      }

      setAiAnalysis(data.analysis);
      setAiGrounding(data.grounding || null);
    } catch (error) {
      setAiError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // -----------------------------------
  // AI FEEDBACK
  // -----------------------------------

  const handleAiFeedback = async (feedback) => {
    try {
      setIsSavingFeedback(true);
      setFeedbackError('');

      const response = await fetch(
        `http://localhost:5001/api/incidents/${id}/ai-feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            feedback,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to save AI feedback'
        );
      }

      if (data.incident) {
        onUpdateIncident(data.incident);
      }
    } catch (error) {
      setFeedbackError(error.message);
    } finally {
      setIsSavingFeedback(false);
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
            backgroundColor: 'white',
            border: '1px solid #d9dee8',
            borderRadius: '10px',
            padding: '40px',
          }}
        >
          <h2
            style={{
              color: '#111827',
              marginTop: '0',
            }}
          >
            Incident not found
          </h2>

          <p
            style={{
              color: '#64748b',
            }}
          >
            This incident may have been deleted or is
            unavailable.
          </p>

          <button
            onClick={() => history.push('/')}
            style={{
              marginTop: '10px',
              padding: '10px 18px',
              border: 'none',
              borderRadius: '7px',
              backgroundColor: '#2563eb',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------
  // ACTIVITY
  // -----------------------------------

  const activity = [
    ...(incident.activity || []),
  ].sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  );

  // -----------------------------------
  // COLORS
  // -----------------------------------

  const priorityColor =
    incident.priority === 'Critical'
      ? '#dc2626'
      : incident.priority === 'High'
      ? '#ef4444'
      : incident.priority === 'Medium'
      ? '#b7791f'
      : '#16a34a';

  const statusColor =
    incident.status === 'Resolved'
      ? '#16a34a'
      : incident.status === 'In Progress'
      ? '#2563eb'
      : '#1554c0';

  // -----------------------------------
  // JSX
  // -----------------------------------

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 30px 50px',
        boxSizing: 'border-box',
      }}
    >
      {/* BACK BUTTON */}

      <button
        onClick={() => history.push('/')}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: '#2563eb',
          fontWeight: '600',
          cursor: 'pointer',
          padding: '10px 0',
          marginBottom: '10px',
          fontSize: '14px',
        }}
      >
        ← Back to Dashboard
      </button>

      {/* INCIDENT HEADER */}

      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #d9dee8',
          borderRadius: '10px',
          padding: '28px',
          marginBottom: '20px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
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
                textTransform: 'uppercase',
                letterSpacing: '0.7px',
                marginBottom: '8px',
              }}
            >
              Incident
            </div>

            <h1
              style={{
                margin: '0 0 12px',
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
              {incident.description}
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
                padding: '7px 12px',
                borderRadius: '20px',
                backgroundColor: '#f8fafc',
                border: `1px solid ${priorityColor}`,
                color: priorityColor,
                fontSize: '13px',
                fontWeight: '700',
              }}
            >
              {incident.priority}
            </span>

            <span
              style={{
                padding: '7px 12px',
                borderRadius: '20px',
                backgroundColor: '#f8fafc',
                border: `1px solid ${statusColor}`,
                color: statusColor,
                fontSize: '13px',
                fontWeight: '700',
              }}
            >
              {incident.status}
            </span>
          </div>
        </div>
      </div>

      {/* AI INCIDENT COPILOT */}

      <div
        style={{
          backgroundColor: '#f8faff',
          border: '1px solid #c7d7fe',
          borderRadius: '12px',
          padding: '26px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '5px',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}
              >
                ✦
              </div>

              <h2
                style={{
                  margin: '0',
                  color: '#111827',
                  fontSize: '20px',
                }}
              >
                AI Incident Copilot
              </h2>
            </div>

            <p
              style={{
                color: '#64748b',
                fontSize: '14px',
                marginBottom: '0',
                lineHeight: '1.6',
              }}
            >
              Analyze incident context using OpsPilot
              runbooks to generate grounded
              troubleshooting recommendations.
            </p>
          </div>

          <button
            onClick={handleAnalyzeIncident}
            disabled={isAnalyzing}
            style={{
              backgroundColor: isAnalyzing
                ? '#94a3b8'
                : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '7px',
              padding: '11px 18px',
              fontWeight: '600',
              cursor: isAnalyzing
                ? 'not-allowed'
                : 'pointer',
              fontSize: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            {isAnalyzing
              ? 'Analyzing...'
              : '✦ Analyze Incident'}
          </button>
        </div>

        {/* AI LOADING */}

        {isAnalyzing && (
          <div
            style={{
              marginTop: '22px',
              padding: '18px',
              backgroundColor: 'white',
              border: '1px solid #dbeafe',
              borderRadius: '8px',
              color: '#475569',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            OpsPilot AI is retrieving runbooks and
            analyzing the incident...
          </div>
        )}

        {/* AI ERROR */}

        {aiError && (
          <div
            style={{
              marginTop: '20px',
              padding: '14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '7px',
              color: '#b91c1c',
              fontSize: '14px',
            }}
          >
            <strong>AI analysis failed:</strong>{' '}
            {aiError}
          </div>
        )}

        {/* AI RESULT */}

        {aiAnalysis && !isAnalyzing && (
          <div
            style={{
              marginTop: '22px',
              backgroundColor: 'white',
              border: '1px solid #dbeafe',
              borderRadius: '10px',
              padding: '22px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                marginBottom: '22px',
              }}
            >
              <h3
                style={{
                  margin: '0',
                  color: '#111827',
                  fontSize: '18px',
                }}
              >
                AI Analysis
              </h3>

              <span
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                AI GENERATED
              </span>
            </div>

            {/* GROUNDING */}

            {aiGrounding && (
              <div
                style={{
                  marginBottom: '22px',
                  padding: '16px',
                  backgroundColor:
                    aiGrounding.grounded
                      ? '#f0fdf4'
                      : '#f8fafc',
                  border: aiGrounding.grounded
                    ? '1px solid #bbf7d0'
                    : '1px solid #e2e8f0',
                  borderRadius: '9px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom:
                      aiGrounding.grounded &&
                      aiGrounding.sources?.length >
                        0
                        ? '14px'
                        : '0',
                  }}
                >
                  <span
                    style={{
                      color: aiGrounding.grounded
                        ? '#16a34a'
                        : '#64748b',
                      fontWeight: '700',
                    }}
                  >
                    {aiGrounding.grounded
                      ? '✓'
                      : '○'}
                  </span>

                  <span
                    style={{
                      color: aiGrounding.grounded
                        ? '#166534'
                        : '#475569',
                      fontSize: '14px',
                      fontWeight: '700',
                    }}
                  >
                    {aiGrounding.grounded
                      ? 'Grounded with OpsPilot Runbooks'
                      : 'No relevant runbook retrieved'}
                  </span>
                </div>

                {aiGrounding.grounded &&
                  aiGrounding.sources?.map(
                    (source, index) => (
                      <div
                        key={
                          source.id || index
                        }
                        style={{
                          backgroundColor:
                            'white',
                          border:
                            '1px solid #dcfce7',
                          borderRadius: '7px',
                          padding: '13px',
                          marginBottom:
                            index ===
                            aiGrounding.sources
                              .length -
                              1
                              ? '0'
                              : '10px',
                        }}
                      >
                        <div
                          style={{
                            color: '#111827',
                            fontSize: '14px',
                            fontWeight: '700',
                            marginBottom: '7px',
                          }}
                        >
                          Source {index + 1}:{' '}
                          {source.title}
                        </div>

                        <div
                          style={{
                            color: '#64748b',
                            fontSize: '12px',
                            lineHeight: '1.8',
                          }}
                        >
                          <div>
                            <strong>
                              Category:
                            </strong>{' '}
                            {source.category}
                          </div>

                          <div>
                            <strong>
                              Retrieval method:
                            </strong>{' '}
                            {source.retrievalType ===
                            'semantic'
                              ? 'Semantic'
                              : source.retrievalType ===
                                'keyword'
                              ? 'Keyword fallback'
                              : 'Unknown'}
                          </div>

                          {source.retrievalType ===
                            'semantic' && (
                            <div>
                              <strong>
                                Semantic
                                similarity:
                              </strong>{' '}
                              {source.semanticScore !==
                                null &&
                              source.semanticScore !==
                                undefined
                                ? source.semanticScore
                                : 'Not available'}
                            </div>
                          )}

                          {source.retrievalType ===
                            'keyword' && (
                            <>
                              <div>
                                <strong>
                                  Matched
                                  keywords:
                                </strong>{' '}
                                {source
                                  .matchedKeywords
                                  ?.length
                                  ? source.matchedKeywords.join(
                                      ', '
                                    )
                                  : 'None'}
                              </div>

                              <div>
                                <strong>
                                  Keyword score:
                                </strong>{' '}
                                {source.score !==
                                  null &&
                                source.score !==
                                  undefined
                                  ? source.score
                                  : 'Not available'}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  )}

                {!aiGrounding.grounded && (
                  <div
                    style={{
                      color: '#64748b',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      marginTop: '8px',
                    }}
                  >
                    The AI analysis was generated
                    from the incident context because
                    no matching OpsPilot runbook was
                    found.
                  </div>
                )}
              </div>
            )}

            {/* SUMMARY */}

            <div
              style={{
                marginBottom: '22px',
              }}
            >
              <div
                style={{
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: '7px',
                }}
              >
                Summary
              </div>

              <div
                style={{
                  color: '#374151',
                  fontSize: '14px',
                  lineHeight: '1.7',
                }}
              >
                {aiAnalysis.summary}
              </div>
            </div>

            {/* ROOT CAUSES */}

            <div
              style={{
                marginBottom: '22px',
              }}
            >
              <div
                style={{
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: '9px',
                }}
              >
                Possible Root Causes
              </div>

              {aiAnalysis.rootCauses?.map(
                (cause, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      marginBottom: '8px',
                      color: '#374151',
                      fontSize: '14px',
                      lineHeight: '1.6',
                    }}
                  >
                    <span
                      style={{
                        color: '#2563eb',
                        fontWeight: '700',
                      }}
                    >
                      •
                    </span>

                    <span>{cause}</span>
                  </div>
                )
              )}
            </div>

            {/* RECOMMENDED STEPS */}

            <div
              style={{
                marginBottom: '22px',
              }}
            >
              <div
                style={{
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: '10px',
                }}
              >
                Recommended Steps
              </div>

              {aiAnalysis.recommendedSteps?.map(
                (step, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      marginBottom: '10px',
                      color: '#374151',
                      fontSize: '14px',
                      lineHeight: '1.6',
                    }}
                  >
                    <div
                      style={{
                        minWidth: '25px',
                        height: '25px',
                        borderRadius: '50%',
                        backgroundColor:
                          '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          'center',
                        fontSize: '12px',
                        fontWeight: '700',
                      }}
                    >
                      {index + 1}
                    </div>

                    <span>{step}</span>
                  </div>
                )
              )}
            </div>

            {/* PRIORITY + NEXT ACTION */}

            <div
              style={{
                display: 'flex',
                gap: '15px',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  flex: '1',
                  minWidth: '180px',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  border:
                    '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform:
                      'uppercase',
                    marginBottom: '7px',
                  }}
                >
                  Suggested Priority
                </div>

                <div
                  style={{
                    color:
                      aiAnalysis.suggestedPriority ===
                      'Critical'
                        ? '#dc2626'
                        : aiAnalysis.suggestedPriority ===
                          'High'
                        ? '#ef4444'
                        : aiAnalysis.suggestedPriority ===
                          'Medium'
                        ? '#b7791f'
                        : '#16a34a',
                    fontWeight: '700',
                    fontSize: '15px',
                  }}
                >
                  {
                    aiAnalysis.suggestedPriority
                  }
                </div>
              </div>

              <div
                style={{
                  flex: '2',
                  minWidth: '260px',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  border:
                    '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform:
                      'uppercase',
                    marginBottom: '7px',
                  }}
                >
                  Next Action
                </div>

                <div
                  style={{
                    color: '#374151',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    fontWeight: '600',
                  }}
                >
                  {aiAnalysis.nextAction}
                </div>
              </div>
            </div>

            {/* AI FEEDBACK */}

            <div
              style={{
                marginTop: '22px',
                paddingTop: '20px',
                borderTop:
                  '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '12px',
                }}
              >
                Was this analysis helpful?
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
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
                    padding: '9px 16px',
                    borderRadius: '7px',
                    border:
                      incident.aiFeedback ===
                      'helpful'
                        ? '1px solid #16a34a'
                        : '1px solid #cbd5e1',
                    backgroundColor:
                      incident.aiFeedback ===
                      'helpful'
                        ? '#f0fdf4'
                        : 'white',
                    color:
                      incident.aiFeedback ===
                      'helpful'
                        ? '#15803d'
                        : '#475569',
                    fontWeight: '600',
                    cursor:
                      isSavingFeedback
                        ? 'not-allowed'
                        : 'pointer',
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
                    padding: '9px 16px',
                    borderRadius: '7px',
                    border:
                      incident.aiFeedback ===
                      'not_helpful'
                        ? '1px solid #dc2626'
                        : '1px solid #cbd5e1',
                    backgroundColor:
                      incident.aiFeedback ===
                      'not_helpful'
                        ? '#fef2f2'
                        : 'white',
                    color:
                      incident.aiFeedback ===
                      'not_helpful'
                        ? '#b91c1c'
                        : '#475569',
                    fontWeight: '600',
                    cursor:
                      isSavingFeedback
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  👎 Not Helpful
                </button>
              </div>

              {isSavingFeedback && (
                <div
                  style={{
                    marginTop: '10px',
                    color: '#64748b',
                    fontSize: '13px',
                  }}
                >
                  Saving feedback...
                </div>
              )}

              {incident.aiFeedback &&
                !isSavingFeedback && (
                  <div
                    style={{
                      marginTop: '10px',
                      color: '#16a34a',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    ✓ Feedback saved
                  </div>
                )}

              {feedbackError && (
                <div
                  style={{
                    marginTop: '10px',
                    color: '#dc2626',
                    fontSize: '13px',
                  }}
                >
                  {feedbackError}
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: '20px',
                paddingTop: '14px',
                borderTop:
                  '1px solid #e5e7eb',
                color: '#94a3b8',
                fontSize: '12px',
              }}
            >
              AI recommendations may be
              incomplete. Engineers should verify
              findings before taking production
              actions.
            </div>
          </div>
        )}
      </div>

      {/* INCIDENT INFORMATION + ACTIONS */}

      <div
        style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        {/* INFORMATION */}

        <div
          style={{
            flex: '1',
            minWidth: '280px',
            backgroundColor: 'white',
            border: '1px solid #d9dee8',
            borderRadius: '10px',
            padding: '22px',
          }}
        >
          <h3
            style={{
              marginTop: '0',
              color: '#111827',
              fontSize: '17px',
            }}
          >
            Incident Information
          </h3>

          <div
            style={{
              borderBottom:
                '1px solid #e5e7eb',
              padding: '11px 0',
            }}
          >
            <span
              style={{
                color: '#64748b',
                fontSize: '13px',
              }}
            >
              Priority
            </span>

            <div
              style={{
                marginTop: '4px',
                fontWeight: '700',
                color: priorityColor,
              }}
            >
              {incident.priority}
            </div>
          </div>

          <div
            style={{
              borderBottom:
                '1px solid #e5e7eb',
              padding: '11px 0',
            }}
          >
            <span
              style={{
                color: '#64748b',
                fontSize: '13px',
              }}
            >
              Status
            </span>

            <div
              style={{
                marginTop: '4px',
                fontWeight: '700',
                color: statusColor,
              }}
            >
              {incident.status}
            </div>
          </div>

          <div
            style={{
              borderBottom:
                '1px solid #e5e7eb',
              padding: '11px 0',
            }}
          >
            <span
              style={{
                color: '#64748b',
                fontSize: '13px',
              }}
            >
              Created
            </span>

            <div
              style={{
                marginTop: '4px',
                color: '#374151',
                fontSize: '14px',
              }}
            >
              {formatDate(
                incident.createdAt
              )}
            </div>
          </div>

          <div
            style={{
              padding: '11px 0 0',
            }}
          >
            <span
              style={{
                color: '#64748b',
                fontSize: '13px',
              }}
            >
              Last Updated
            </span>

            <div
              style={{
                marginTop: '4px',
                color: '#374151',
                fontSize: '14px',
              }}
            >
              {formatDate(
                incident.updatedAt
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS */}

        <div
          style={{
            flex: '1',
            minWidth: '280px',
            backgroundColor: 'white',
            border: '1px solid #d9dee8',
            borderRadius: '10px',
            padding: '22px',
          }}
        >
          <h3
            style={{
              marginTop: '0',
              marginBottom: '8px',
              color: '#111827',
              fontSize: '17px',
            }}
          >
            Incident Actions
          </h3>

          <p
            style={{
              color: '#64748b',
              fontSize: '14px',
              marginTop: '0',
              marginBottom: '20px',
            }}
          >
            Update the incident workflow or remove
            the incident.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexDirection: 'column',
            }}
          >
            {incident.status === 'Open' && (
              <button
                disabled={
                  isUpdatingStatus
                }
                onClick={() =>
                  handleStatusChange(
                    'In Progress'
                  )
                }
                style={{
                  padding: '10px 14px',
                  borderRadius: '7px',
                  border:
                    '1px solid #2563eb',
                  backgroundColor: 'white',
                  color: '#2563eb',
                  fontWeight: '600',
                  cursor:
                    isUpdatingStatus
                      ? 'not-allowed'
                      : 'pointer',
                }}
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
                style={{
                  padding: '10px 14px',
                  borderRadius: '7px',
                  border:
                    '1px solid #16a34a',
                  backgroundColor: 'white',
                  color: '#16a34a',
                  fontWeight: '600',
                  cursor:
                    isUpdatingStatus
                      ? 'not-allowed'
                      : 'pointer',
                }}
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
                  handleStatusChange('Open')
                }
                style={{
                  padding: '10px 14px',
                  borderRadius: '7px',
                  border:
                    '1px solid #2563eb',
                  backgroundColor: 'white',
                  color: '#2563eb',
                  fontWeight: '600',
                  cursor:
                    isUpdatingStatus
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                Reopen Incident
              </button>
            )}

            <button
              disabled={isDeleting}
              onClick={handleDelete}
              style={{
                padding: '10px 14px',
                borderRadius: '7px',
                border:
                  '1px solid #dc2626',
                backgroundColor: 'white',
                color: '#dc2626',
                fontWeight: '600',
                cursor: isDeleting
                  ? 'not-allowed'
                  : 'pointer',
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

      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #d9dee8',
          borderRadius: '10px',
          padding: '24px',
          marginBottom: '20px',
        }}
      >
        <h3
          style={{
            color: '#111827',
            marginTop: '0',
            marginBottom: '7px',
            fontSize: '18px',
          }}
        >
          Add Note
        </h3>

        <p
          style={{
            color: '#64748b',
            fontSize: '14px',
            marginTop: '0',
            marginBottom: '15px',
          }}
        >
          Record investigation findings,
          troubleshooting steps, or important
          updates.
        </p>

        <form onSubmit={handleAddNote}>
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setNoteError('');
            }}
            placeholder="Example: Investigating database connection pool..."
            rows="4"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical',
              padding: '12px',
              border:
                '1px solid #cbd5e1',
              borderRadius: '7px',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
              lineHeight: '1.5',
            }}
          />

          {noteError && (
            <div
              style={{
                color: '#dc2626',
                fontSize: '13px',
                marginTop: '8px',
              }}
            >
              {noteError}
            </div>
          )}

          <button
            type="submit"
            disabled={isAddingNote}
            style={{
              marginTop: '12px',
              padding: '10px 18px',
              border: 'none',
              borderRadius: '7px',
              backgroundColor:
                isAddingNote
                  ? '#94a3b8'
                  : '#2563eb',
              color: 'white',
              fontWeight: '600',
              cursor: isAddingNote
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

      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #d9dee8',
          borderRadius: '10px',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h3
            style={{
              color: '#111827',
              margin: '0',
              fontSize: '18px',
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

        {activity.length === 0 ? (
          <div
            style={{
              padding: '25px 0',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '14px',
            }}
          >
            No activity has been recorded yet.
          </div>
        ) : (
          activity.map(
            (activityItem, index) => {
              const dotColor =
                activityItem.type ===
                'note'
                  ? '#2563eb'
                  : activityItem.type ===
                    'status'
                  ? '#16a34a'
                  : '#64748b';

              return (
                <div
                  key={
                    activityItem._id ||
                    `${activityItem.createdAt}-${index}`
                  }
                  style={{
                    display: 'flex',
                    gap: '15px',
                    position: 'relative',
                    paddingBottom:
                      index ===
                      activity.length - 1
                        ? '0'
                        : '22px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection:
                        'column',
                      alignItems:
                        'center',
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor:
                          dotColor,
                        marginTop: '4px',
                        zIndex: '2',
                      }}
                    />

                    {index !==
                      activity.length -
                        1 && (
                      <div
                        style={{
                          width: '2px',
                          flex: '1',
                          minHeight:
                            '35px',
                          backgroundColor:
                            '#e5e7eb',
                          marginTop: '4px',
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        color: '#374151',
                        fontWeight: '600',
                        fontSize: '14px',
                        marginBottom:
                          '4px',
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
                      }}
                    >
                      {formatDate(
                        activityItem.createdAt
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          )
        )}
      </div>
    </div>
  );
};

export default IncidentDetails;