import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

const Dashboard = ({
  incidents,
  onDeleteIncident,
  onUpdateStatus,
  realtimeStatus,
}) => {
  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState('All');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('All');

  const [
    sortOption,
    setSortOption,
  ] = useState('Newest');

  const [
    noteInputs,
    setNoteInputs,
  ] = useState({});

  const [
    activityOverrides,
    setActivityOverrides,
  ] = useState({});

  const [
    savingNoteId,
    setSavingNoteId,
  ] = useState(null);

  const [
    noteErrors,
    setNoteErrors,
  ] = useState({});

  // -----------------------------------
  // AI EVALUATION STATE
  // -----------------------------------

  const [
    aiMetrics,
    setAiMetrics,
  ] = useState({
    totalAnalyses: 0,
    groundedAnalyses: 0,
    groundingRate: 0,
    helpful: 0,
    notHelpful: 0,
    noFeedback: 0,
    ratedAnalyses: 0,
    helpfulRate: 0,
    averageSemanticSimilarity: null,
    semanticEvaluations: 0,
  });

  const [
    isAiMetricsLoading,
    setIsAiMetricsLoading,
  ] = useState(true);

  const [
    aiMetricsError,
    setAiMetricsError,
  ] = useState('');

  // -----------------------------------
  // OBSERVABILITY STATE
  // -----------------------------------

  const [
    observability,
    setObservability,
  ] = useState({
    generatedAt: null,

    http: {
      totalRequests: 0,
      totalErrors: 0,
      errorRate: 0,
      averageLatencyMs: 0,
      totalLatencySeconds: 0,
    },

    ai: {
      totalRequests: 0,
      averageLatencySeconds: 0,
      totalLatencySeconds: 0,
    },

    embeddings: {
      totalGenerated: 0,
      averageLatencyMs: 0,
      totalLatencySeconds: 0,
    },

    semanticSearch: {
      totalSearches: 0,
      averageLatencySeconds: 0,
      totalLatencySeconds: 0,
    },
  });

  const [
    isObservabilityLoading,
    setIsObservabilityLoading,
  ] = useState(true);

  const [
    observabilityError,
    setObservabilityError,
  ] = useState('');

  const token =
    localStorage.getItem(
      'token'
    );

  // -----------------------------------
  // SHARED STYLES
  // -----------------------------------

  const iconStyle = {
    width: '18px',
    height: '18px',
    flexShrink: 0,
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 12px',
    border:
      '1px solid #cbd5e1',
    borderRadius: '7px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: 'white',
  };

  const statCardStyle = {
    flex: '1',
    minWidth: '110px',
    backgroundColor: 'white',
    border:
      '1px solid #d9dee8',
    borderRadius: '8px',
    padding: '16px 12px',
    textAlign: 'center',
    boxSizing: 'border-box',
  };

  // -----------------------------------
  // REAL-TIME STATUS
  // -----------------------------------

  const getRealtimeStatusConfig =
    () => {
      if (
        realtimeStatus ===
        'live'
      ) {
        return {
          label: 'Live',
          textColor:
            '#15803d',
          backgroundColor:
            '#f0fdf4',
          borderColor:
            '#bbf7d0',
          dotColor:
            '#22c55e',
        };
      }

      if (
        realtimeStatus ===
        'connecting'
      ) {
        return {
          label:
            'Connecting...',
          textColor:
            '#a16207',
          backgroundColor:
            '#fefce8',
          borderColor:
            '#fde68a',
          dotColor:
            '#eab308',
        };
      }

      return {
        label:
          'Disconnected',
        textColor:
          '#b91c1c',
        backgroundColor:
          '#fef2f2',
        borderColor:
          '#fecaca',
        dotColor:
          '#ef4444',
      };
    };

  const realtimeConfig =
    getRealtimeStatusConfig();

  // -----------------------------------
  // INCIDENT STATISTICS
  // -----------------------------------

  const totalIncidents =
    incidents.length;

  const openIncidents =
    incidents.filter(
      (incident) =>
        incident.status ===
        'Open'
    ).length;

  const inProgressIncidents =
    incidents.filter(
      (incident) =>
        incident.status ===
        'In Progress'
    ).length;

  const resolvedIncidents =
    incidents.filter(
      (incident) =>
        incident.status ===
        'Resolved'
    ).length;

  const criticalIncidents =
    incidents.filter(
      (incident) =>
        incident.priority ===
        'Critical'
    ).length;

  // -----------------------------------
  // LOAD AI EVALUATION METRICS
  // -----------------------------------

  useEffect(() => {
    let cancelled = false;

    const loadAiMetrics =
      async () => {
        try {
          setIsAiMetricsLoading(
            true
          );

          setAiMetricsError(
            ''
          );

          const response =
            await fetch(
              'http://localhost:5001/api/incidents/analytics/ai-evaluation',
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
                'Failed to load AI evaluation metrics'
            );
          }

          if (!cancelled) {
            setAiMetrics(
              data.metrics
            );
          }
        } catch (error) {
          if (!cancelled) {
            setAiMetricsError(
              error.message
            );
          }
        } finally {
          if (!cancelled) {
            setIsAiMetricsLoading(
              false
            );
          }
        }
      };

    if (token) {
      loadAiMetrics();
    } else {
      setIsAiMetricsLoading(
        false
      );
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  // -----------------------------------
  // LOAD OBSERVABILITY
  // -----------------------------------

  const loadObservability =
    useCallback(
      async () => {
        if (!token) {
          setIsObservabilityLoading(
            false
          );

          return;
        }

        try {
          setIsObservabilityLoading(
            true
          );

          setObservabilityError(
            ''
          );

          const response =
            await fetch(
              'http://localhost:5001/api/observability/summary',
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
                'Failed to load observability metrics'
            );
          }

          setObservability(
            data
          );
        } catch (error) {
          setObservabilityError(
            error.message
          );
        } finally {
          setIsObservabilityLoading(
            false
          );
        }
      },
      [token]
    );

  useEffect(() => {
    loadObservability();
  }, [loadObservability]);

  // -----------------------------------
  // SEARCH + FILTER
  // -----------------------------------

  const filteredIncidents =
    incidents.filter(
      (incident) => {
        const title =
          incident.title || '';

        const description =
          incident.description ||
          '';

        const matchesSearch =
          title
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            ) ||
          description
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            );

        const matchesPriority =
          priorityFilter ===
            'All' ||
          incident.priority ===
            priorityFilter;

        const matchesStatus =
          statusFilter ===
            'All' ||
          incident.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesPriority &&
          matchesStatus
        );
      }
    );

  // -----------------------------------
  // SORTING
  // -----------------------------------

  const priorityOrder = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  const statusOrder = {
    Open: 1,
    'In Progress': 2,
    Resolved: 3,
  };

  const sortedIncidents = [
    ...filteredIncidents,
  ].sort((a, b) => {
    if (
      sortOption === 'Newest'
    ) {
      return (
        new Date(b.createdAt) -
        new Date(a.createdAt)
      );
    }

    if (
      sortOption === 'Oldest'
    ) {
      return (
        new Date(a.createdAt) -
        new Date(b.createdAt)
      );
    }

    if (
      sortOption === 'Priority'
    ) {
      return (
        priorityOrder[b.priority] -
        priorityOrder[a.priority]
      );
    }

    if (
      sortOption === 'Status'
    ) {
      return (
        statusOrder[a.status] -
        statusOrder[b.status]
      );
    }

    return 0;
  });

  // -----------------------------------
  // CLEAR FILTERS
  // -----------------------------------

  const clearFilters = () => {
    setSearchTerm('');

    setPriorityFilter(
      'All'
    );

    setStatusFilter(
      'All'
    );

    setSortOption(
      'Newest'
    );
  };

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
  // NOTE CHANGE
  // -----------------------------------

  const handleNoteChange = (
    incidentId,
    value
  ) => {
    setNoteInputs(
      (currentInputs) => ({
        ...currentInputs,

        [incidentId]:
          value,
      })
    );

    setNoteErrors(
      (currentErrors) => ({
        ...currentErrors,

        [incidentId]:
          '',
      })
    );
  };

  // -----------------------------------
  // ADD NOTE
  // -----------------------------------

  const handleAddNote =
    async (
      incidentId
    ) => {
      const note =
        noteInputs[
          incidentId
        ] || '';

      if (
        !note.trim()
      ) {
        setNoteErrors(
          (currentErrors) => ({
            ...currentErrors,

            [incidentId]:
              'Please enter a note.',
          })
        );

        return;
      }

      try {
        setSavingNoteId(
          incidentId
        );

        setNoteErrors(
          (currentErrors) => ({
            ...currentErrors,

            [incidentId]:
              '',
          })
        );

        const response =
          await fetch(
            `http://localhost:5001/api/incidents/${incidentId}/notes`,
            {
              method:
                'POST',

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

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ||
              'Failed to add note'
          );
        }

        setActivityOverrides(
          (
            currentActivities
          ) => ({
            ...currentActivities,

            [incidentId]:
              data.activity ||
              [],
          })
        );

        setNoteInputs(
          (currentInputs) => ({
            ...currentInputs,

            [incidentId]:
              '',
          })
        );
      } catch (
        error
      ) {
        setNoteErrors(
          (currentErrors) => ({
            ...currentErrors,

            [incidentId]:
              error.message,
          })
        );
      } finally {
        setSavingNoteId(
          null
        );
      }
    };

  // -----------------------------------
  // STATUS UPDATE
  // -----------------------------------

  const handleStatusUpdate =
    async (
      incidentId,
      newStatus
    ) => {
      await onUpdateStatus(
        incidentId,
        newStatus
      );

      setActivityOverrides(
        (
          currentActivities
        ) => {
          const updatedActivities =
            {
              ...currentActivities,
            };

          delete updatedActivities[
            incidentId
          ];

          return updatedActivities;
        }
      );
    };

  // -----------------------------------
  // OBSERVABILITY HELPERS
  // -----------------------------------

  const apiLatencyMs =
    Number(
      observability.http
        ?.averageLatencyMs || 0
    );

  const aiLatencyMs =
    Number(
      observability.ai
        ?.averageLatencySeconds ||
        0
    ) * 1000;

  const embeddingLatencyMs =
    Number(
      observability.embeddings
        ?.averageLatencyMs || 0
    );

  const semanticLatencyMs =
    Number(
      observability
        .semanticSearch
        ?.averageLatencySeconds ||
        0
    ) * 1000;

  const maxObservedLatencyMs =
    Math.max(
      apiLatencyMs,
      aiLatencyMs,
      embeddingLatencyMs,
      semanticLatencyMs,
      1
    );

  const getLatencyBarWidth = (
    value
  ) => {
    if (!value) {
      return '0%';
    }

    const percentage =
      (value /
        maxObservedLatencyMs) *
      100;

    return `${Math.max(
      4,
      Math.min(
        100,
        percentage
      )
    )}%`;
  };

  const formatMilliseconds = (
    value
  ) => {
    const numericValue =
      Number(value || 0);

    if (
      numericValue >= 1000
    ) {
      return `${(
        numericValue / 1000
      ).toFixed(2)} s`;
    }

    return `${numericValue.toFixed(
      1
    )} ms`;
  };

  const latencyMetrics = [
    {
      label:
        'AI Generation',
      value:
        aiLatencyMs,
      color:
        '#7c3aed',
    },

    {
      label:
        'Semantic Search',
      value:
        semanticLatencyMs,
      color:
        '#b7791f',
    },

    {
      label:
        'Embedding Generation',
      value:
        embeddingLatencyMs,
      color:
        '#0f766e',
    },

    {
      label:
        'API Request Average',
      value:
        apiLatencyMs,
      color:
        '#2563eb',
    },
  ];

  // -----------------------------------
  // JSX
  // -----------------------------------

  return (
    <div
      className="dashboard"
      style={{
        maxWidth:
          '850px',

        margin:
          '0 auto',

        padding:
          '0 30px 40px',

        boxSizing:
          'border-box',
      }}
    >
      <h2
        style={{
          color:
            '#111827',

          fontSize:
            '26px',

          marginBottom:
            '20px',

          textAlign:
            'center',
        }}
      >
        Incident Dashboard
      </h2>

      {/* INCIDENT STATISTICS */}

      <div
        style={{
          display:
            'flex',

          gap:
            '12px',

          flexWrap:
            'wrap',

          marginBottom:
            '24px',
        }}
      >
        {[
          {
            value:
              totalIncidents,
            label:
              'Total',
            color:
              '#111827',
          },
          {
            value:
              openIncidents,
            label:
              'Open',
            color:
              '#2563eb',
          },
          {
            value:
              inProgressIncidents,
            label:
              'In Progress',
            color:
              '#b7791f',
          },
          {
            value:
              resolvedIncidents,
            label:
              'Resolved',
            color:
              '#16a34a',
          },
          {
            value:
              criticalIncidents,
            label:
              'Critical',
            color:
              '#dc2626',
          },
        ].map((stat) => (
          <div
            key={
              stat.label
            }
            style={
              statCardStyle
            }
          >
            <div
              style={{
                fontSize:
                  '28px',

                fontWeight:
                  '700',

                color:
                  stat.color,

                marginBottom:
                  '6px',
              }}
            >
              {stat.value}
            </div>

            <div
              style={{
                color:
                  '#64748b',

                fontSize:
                  '14px',

                fontWeight:
                  '600',
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* AI EVALUATION */}

      <div
        style={{
          backgroundColor:
            '#f8faff',

          border:
            '1px solid #c7d7fe',

          borderRadius:
            '10px',

          padding:
            '22px',

          marginBottom:
            '24px',
        }}
      >
        <div
          style={{
            textAlign:
              'center',

            marginBottom:
              '18px',
          }}
        >
          <h3
            style={{
              margin:
                '0 0 6px',

              color:
                '#111827',

              fontSize:
                '19px',
            }}
          >
            AI Evaluation
          </h3>

          <p
            style={{
              margin:
                '0',

              color:
                '#64748b',

              fontSize:
                '13px',

              lineHeight:
                '1.5',
            }}
          >
            Measure grounding
            quality and engineer
            feedback across saved
            AI analysis runs.
          </p>
        </div>

        {isAiMetricsLoading && (
          <div
            style={{
              textAlign:
                'center',

              color:
                '#64748b',

              fontSize:
                '13px',

              padding:
                '10px 0 18px',
            }}
          >
            Loading AI evaluation
            metrics...
          </div>
        )}

        {aiMetricsError &&
          !isAiMetricsLoading && (
            <div
              style={{
                marginBottom:
                  '16px',

                padding:
                  '12px',

                borderRadius:
                  '7px',

                backgroundColor:
                  '#fef2f2',

                border:
                  '1px solid #fecaca',

                color:
                  '#b91c1c',

                fontSize:
                  '13px',

                textAlign:
                  'center',
              }}
            >
              {
                aiMetricsError
              }
            </div>
          )}

        {!isAiMetricsLoading &&
          !aiMetricsError && (
            <>
              <div
                style={{
                  display:
                    'flex',

                  gap:
                    '12px',

                  flexWrap:
                    'wrap',
                }}
              >
                {[
                  {
                    value:
                      aiMetrics.totalAnalyses,
                    label:
                      'Total AI Analyses',
                    color:
                      '#2563eb',
                  },
                  {
                    value:
                      aiMetrics.groundedAnalyses,
                    label:
                      'Grounded Analyses',
                    color:
                      '#16a34a',
                  },
                  {
                    value:
                      `${aiMetrics.groundingRate}%`,
                    label:
                      'Grounding Rate',
                    color:
                      '#0f766e',
                  },
                  {
                    value:
                      aiMetrics.averageSemanticSimilarity ===
                      null
                        ? '—'
                        : aiMetrics.averageSemanticSimilarity,
                    label:
                      'Avg Semantic Similarity',
                    color:
                      '#7c3aed',
                  },
                ].map(
                  (metric) => (
                    <div
                      key={
                        metric.label
                      }
                      style={
                        statCardStyle
                      }
                    >
                      <div
                        style={{
                          fontSize:
                            '27px',

                          fontWeight:
                            '700',

                          color:
                            metric.color,

                          marginBottom:
                            '6px',
                        }}
                      >
                        {
                          metric.value
                        }
                      </div>

                      <div
                        style={{
                          color:
                            '#64748b',

                          fontSize:
                            '13px',

                          fontWeight:
                            '600',
                        }}
                      >
                        {
                          metric.label
                        }
                      </div>
                    </div>
                  )
                )}
              </div>

              <div
                style={{
                  display:
                    'flex',

                  gap:
                    '12px',

                  flexWrap:
                    'wrap',

                  marginTop:
                    '12px',
                }}
              >
                {[
                  {
                    value:
                      aiMetrics.helpful,
                    label:
                      'Helpful',
                    color:
                      '#16a34a',
                  },
                  {
                    value:
                      aiMetrics.notHelpful,
                    label:
                      'Not Helpful',
                    color:
                      '#dc2626',
                  },
                  {
                    value:
                      aiMetrics.noFeedback,
                    label:
                      'No Feedback',
                    color:
                      '#64748b',
                  },
                  {
                    value:
                      `${aiMetrics.helpfulRate}%`,
                    label:
                      'Helpful Rate',
                    color:
                      '#7c3aed',
                  },
                ].map(
                  (metric) => (
                    <div
                      key={
                        metric.label
                      }
                      style={
                        statCardStyle
                      }
                    >
                      <div
                        style={{
                          fontSize:
                            '27px',

                          fontWeight:
                            '700',

                          color:
                            metric.color,

                          marginBottom:
                            '6px',
                        }}
                      >
                        {
                          metric.value
                        }
                      </div>

                      <div
                        style={{
                          color:
                            '#64748b',

                          fontSize:
                            '13px',

                          fontWeight:
                            '600',
                        }}
                      >
                        {
                          metric.label
                        }
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
      </div>

      {/* SYSTEM OBSERVABILITY */}

      <div
        style={{
          backgroundColor:
            '#f8fafc',

          border:
            '1px solid #cbd5e1',

          borderRadius:
            '10px',

          padding:
            '22px',

          marginBottom:
            '24px',
        }}
      >
        <div
          style={{
            textAlign:
              'center',

            marginBottom:
              '18px',
          }}
        >
          <div
            style={{
              display:
                'flex',

              justifyContent:
                'center',

              alignItems:
                'center',

              gap:
                '10px',

              flexWrap:
                'wrap',

              marginBottom:
                '6px',
            }}
          >
            <h3
              style={{
                margin:
                  '0',

                color:
                  '#111827',

                fontSize:
                  '19px',
              }}
            >
              System Observability
            </h3>

            <div
              style={{
                display:
                  'inline-flex',

                alignItems:
                  'center',

                gap:
                  '6px',

                padding:
                  '5px 9px',

                borderRadius:
                  '999px',

                border:
                  `1px solid ${realtimeConfig.borderColor}`,

                backgroundColor:
                  realtimeConfig.backgroundColor,

                color:
                  realtimeConfig.textColor,

                fontSize:
                  '12px',

                fontWeight:
                  '700',
              }}
            >
              <span
                style={{
                  width:
                    '8px',

                  height:
                    '8px',

                  borderRadius:
                    '50%',

                  backgroundColor:
                    realtimeConfig.dotColor,

                  display:
                    'inline-block',
                }}
              />

              {
                realtimeConfig.label
              }
            </div>
          </div>

          <p
            style={{
              margin:
                '0 0 14px',

              color:
                '#64748b',

              fontSize:
                '13px',

              lineHeight:
                '1.5',
            }}
          >
            Live backend telemetry
            for API traffic,
            reliability, Gemini,
            embeddings, and
            semantic retrieval.
          </p>

          <button
            type="button"
            onClick={
              loadObservability
            }
            disabled={
              isObservabilityLoading
            }
            style={{
              display:
                'inline-flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              gap:
                '7px',

              padding:
                '9px 15px',

              borderRadius:
                '7px',

              border:
                '1px solid #2563eb',

              backgroundColor:
                isObservabilityLoading
                  ? '#e2e8f0'
                  : 'white',

              color:
                isObservabilityLoading
                  ? '#64748b'
                  : '#2563eb',

              fontWeight:
                '600',

              fontSize:
                '13px',

              cursor:
                isObservabilityLoading
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5" />
              <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
            </svg>

            {isObservabilityLoading
              ? 'Refreshing...'
              : 'Refresh Metrics'}
          </button>
        </div>

        {isObservabilityLoading && (
          <div
            style={{
              textAlign:
                'center',

              color:
                '#64748b',

              fontSize:
                '13px',

              marginBottom:
                '14px',
            }}
          >
            Loading observability
            metrics...
          </div>
        )}

        {observabilityError &&
          !isObservabilityLoading && (
            <div
              style={{
                padding:
                  '12px',

                borderRadius:
                  '7px',

                backgroundColor:
                  '#fef2f2',

                border:
                  '1px solid #fecaca',

                color:
                  '#b91c1c',

                textAlign:
                  'center',
              }}
            >
              {
                observabilityError
              }
            </div>
          )}

        {!observabilityError && (
          <>
            <div
              style={{
                display:
                  'flex',

                gap:
                  '12px',

                flexWrap:
                  'wrap',

                opacity:
                  isObservabilityLoading
                    ? 0.65
                    : 1,
              }}
            >
              {[
                {
                  value:
                    observability.http.totalRequests,
                  label:
                    'API Requests',
                  color:
                    '#2563eb',
                },
                {
                  value:
                    `${observability.http.errorRate}%`,
                  label:
                    'Error Rate',
                  color:
                    observability.http.errorRate >
                    5
                      ? '#dc2626'
                      : '#16a34a',
                },
                {
                  value:
                    formatMilliseconds(
                      apiLatencyMs
                    ),
                  label:
                    'Avg API Latency',
                  color:
                    '#0f766e',
                },
                {
                  value:
                    observability.ai.totalRequests,
                  label:
                    'AI Requests',
                  color:
                    '#7c3aed',
                },
              ].map(
                (metric) => (
                  <div
                    key={
                      metric.label
                    }
                    style={
                      statCardStyle
                    }
                  >
                    <div
                      style={{
                        fontSize:
                          '27px',

                        fontWeight:
                          '700',

                        color:
                          metric.color,

                        marginBottom:
                          '6px',
                      }}
                    >
                      {
                        metric.value
                      }
                    </div>

                    <div
                      style={{
                        color:
                          '#64748b',

                        fontSize:
                          '13px',

                        fontWeight:
                          '600',
                      }}
                    >
                      {
                        metric.label
                      }
                    </div>
                  </div>
                )
              )}
            </div>

            <div
              style={{
                display:
                  'flex',

                gap:
                  '12px',

                flexWrap:
                  'wrap',

                marginTop:
                  '12px',

                opacity:
                  isObservabilityLoading
                    ? 0.65
                    : 1,
              }}
            >
              {[
                {
                  value:
                    formatMilliseconds(
                      aiLatencyMs
                    ),
                  label:
                    'Avg AI Latency',
                  color:
                    '#7c3aed',
                },
                {
                  value:
                    observability.embeddings.totalGenerated,
                  label:
                    'Embeddings',
                  color:
                    '#0f766e',
                },
                {
                  value:
                    formatMilliseconds(
                      embeddingLatencyMs
                    ),
                  label:
                    'Avg Embedding',
                  color:
                    '#0f766e',
                },
                {
                  value:
                    formatMilliseconds(
                      semanticLatencyMs
                    ),
                  label:
                    'Semantic Search',
                  color:
                    '#b7791f',
                },
              ].map(
                (metric) => (
                  <div
                    key={
                      metric.label
                    }
                    style={
                      statCardStyle
                    }
                  >
                    <div
                      style={{
                        fontSize:
                          '27px',

                        fontWeight:
                          '700',

                        color:
                          metric.color,

                        marginBottom:
                          '6px',
                      }}
                    >
                      {
                        metric.value
                      }
                    </div>

                    <div
                      style={{
                        color:
                          '#64748b',

                        fontSize:
                          '13px',

                        fontWeight:
                          '600',
                      }}
                    >
                      {
                        metric.label
                      }
                    </div>
                  </div>
                )
              )}
            </div>

            <div
              style={{
                marginTop:
                  '18px',

                padding:
                  '16px',

                border:
                  '1px solid #e2e8f0',

                borderRadius:
                  '8px',

                backgroundColor:
                  'white',

                opacity:
                  isObservabilityLoading
                    ? 0.65
                    : 1,
              }}
            >
              <div
                style={{
                  color:
                    '#111827',

                  fontWeight:
                    '700',

                  fontSize:
                    '14px',

                  marginBottom:
                    '16px',
                }}
              >
                Latency Breakdown
              </div>

              {latencyMetrics.map(
                (metric) => (
                  <div
                    key={
                      metric.label
                    }
                    style={{
                      marginBottom:
                        '14px',
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',

                        justifyContent:
                          'space-between',

                        gap:
                          '12px',

                        marginBottom:
                          '6px',

                        fontSize:
                          '12px',

                        color:
                          '#475569',
                      }}
                    >
                      <span>
                        {
                          metric.label
                        }
                      </span>

                      <strong
                        style={{
                          color:
                            '#111827',
                        }}
                      >
                        {formatMilliseconds(
                          metric.value
                        )}
                      </strong>
                    </div>

                    <div
                      style={{
                        width:
                          '100%',

                        height:
                          '8px',

                        backgroundColor:
                          '#e2e8f0',

                        borderRadius:
                          '999px',

                        overflow:
                          'hidden',
                      }}
                    >
                      <div
                        style={{
                          width:
                            getLatencyBarWidth(
                              metric.value
                            ),

                          height:
                            '100%',

                          backgroundColor:
                            metric.color,

                          borderRadius:
                            '999px',

                          transition:
                            'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                )
              )}

              <div
                style={{
                  marginTop:
                    '8px',

                  paddingTop:
                    '12px',

                  borderTop:
                    '1px solid #e2e8f0',

                  color:
                    '#64748b',

                  fontSize:
                    '12px',

                  lineHeight:
                    '1.6',
                }}
              >
                Semantic searches:{' '}
                {
                  observability
                    .semanticSearch
                    .totalSearches
                }
                {' · '}
                Backend errors:{' '}
                {
                  observability
                    .http
                    .totalErrors
                }
                {' · '}
                Metrics reset when
                the backend container
                restarts.
              </div>

              {observability.generatedAt && (
                <div
                  style={{
                    marginTop:
                      '8px',

                    color:
                      '#94a3b8',

                    fontSize:
                      '11px',

                    textAlign:
                      'right',
                  }}
                >
                  Last refreshed:{' '}
                  {formatDate(
                    observability.generatedAt
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* SEARCH / FILTER / SORT */}

      <div
        style={{
          border:
            '1px solid #d9dee8',

          borderRadius:
            '8px',

          backgroundColor:
            'white',

          padding:
            '20px',

          marginBottom:
            '24px',
        }}
      >
        <input
          type="text"
          placeholder="Search incidents..."
          value={
            searchTerm
          }
          onChange={(e) =>
            setSearchTerm(
              e.target.value
            )
          }
          style={{
            ...inputStyle,

            marginBottom:
              '14px',
          }}
        />

        <div
          style={{
            display:
              'flex',

            gap:
              '12px',

            flexWrap:
              'wrap',
          }}
        >
          <select
            value={
              priorityFilter
            }
            onChange={(e) =>
              setPriorityFilter(
                e.target.value
              )
            }
            style={{
              ...inputStyle,

              flex:
                '1',

              minWidth:
                '180px',

              cursor:
                'pointer',
            }}
          >
            <option value="All">
              All Priorities
            </option>

            <option value="Low">
              Low
            </option>

            <option value="Medium">
              Medium
            </option>

            <option value="High">
              High
            </option>

            <option value="Critical">
              Critical
            </option>
          </select>

          <select
            value={
              statusFilter
            }
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            style={{
              ...inputStyle,

              flex:
                '1',

              minWidth:
                '180px',

              cursor:
                'pointer',
            }}
          >
            <option value="All">
              All Statuses
            </option>

            <option value="Open">
              Open
            </option>

            <option value="In Progress">
              In Progress
            </option>

            <option value="Resolved">
              Resolved
            </option>
          </select>

          <select
            value={
              sortOption
            }
            onChange={(e) =>
              setSortOption(
                e.target.value
              )
            }
            style={{
              ...inputStyle,

              flex:
                '1',

              minWidth:
                '180px',

              cursor:
                'pointer',
            }}
          >
            <option value="Newest">
              Newest First
            </option>

            <option value="Oldest">
              Oldest First
            </option>

            <option value="Priority">
              Priority:
              Critical → Low
            </option>

            <option value="Status">
              Status: Open →
              In Progress →
              Resolved
            </option>
          </select>
        </div>

        <button
          onClick={
            clearFilters
          }
          style={{
            width:
              '100%',

            marginTop:
              '14px',

            backgroundColor:
              'white',

            color:
              '#2563eb',

            border:
              '1px solid #2563eb',

            padding:
              '10px 14px',

            borderRadius:
              '7px',

            cursor:
              'pointer',

            fontWeight:
              '600',

            fontSize:
              '14px',
          }}
        >
          Clear Filters
        </button>
      </div>

      <p
        style={{
          textAlign:
            'center',

          color:
            '#64748b',

          marginBottom:
            '18px',

          fontSize:
            '14px',
        }}
      >
        Showing{' '}
        {
          sortedIncidents.length
        }{' '}
        of{' '}
        {
          incidents.length
        }{' '}
        incidents
      </p>

      {sortedIncidents.length ===
        0 && (
          <div
            style={{
              border:
                '1px solid #d9dee8',

              borderRadius:
                '8px',

              padding:
                '30px',

              textAlign:
                'center',

              color:
                '#64748b',

              backgroundColor:
                'white',
            }}
          >
            No incidents match
            your search or
            filters.
          </div>
        )}

      {/* INCIDENT CARDS */}

      {sortedIncidents.map(
        (incident) => {
          const activity =
            activityOverrides[
              incident._id
            ] ||
            incident.activity ||
            [];

          const sortedActivity =
            [
              ...activity,
            ].sort(
              (a, b) =>
                new Date(
                  b.createdAt
                ) -
                new Date(
                  a.createdAt
                )
            );

          return (
            <div
              key={
                incident._id
              }
              style={{
                border:
                  '1px solid #d9dee8',

                padding:
                  '24px',

                marginBottom:
                  '20px',

                borderRadius:
                  '8px',

                width:
                  '100%',

                boxSizing:
                  'border-box',

                backgroundColor:
                  'white',

                textAlign:
                  'center',
              }}
            >
              <Link
                to={`/incidents/${incident._id}`}
                style={{
                  textDecoration:
                    'none',
                }}
              >
                <h3
                  style={{
                    color:
                      '#1f2937',

                    marginTop:
                      '0',

                    marginBottom:
                      '8px',

                    fontWeight:
                      '700',

                    cursor:
                      'pointer',
                  }}
                >
                  {
                    incident.title
                  }
                </h3>
              </Link>

              <Link
                to={`/incidents/${incident._id}`}
                style={{
                  display:
                    'inline-block',

                  marginBottom:
                    '18px',

                  color:
                    '#2563eb',

                  fontSize:
                    '13px',

                  fontWeight:
                    '600',

                  textDecoration:
                    'none',
                }}
              >
                View Details →
              </Link>

              <p
                style={{
                  color:
                    '#374151',

                  marginTop:
                    '0',

                  marginBottom:
                    '18px',
                }}
              >
                {
                  incident.description
                }
              </p>

              {/* PRIORITY */}

              <div
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  gap:
                    '7px',

                  marginBottom:
                    '16px',

                  color:
                    '#172554',
                }}
              >
                <svg
                  style={
                    iconStyle
                  }
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 21V4" />

                  <path d="M5 5C9 2 13 8 19 4V13C13 17 9 11 5 14" />
                </svg>

                <span>
                  Priority:{' '}

                  <strong
                    style={{
                      color:
                        incident.priority ===
                        'Critical'
                          ? '#dc2626'
                          : incident.priority ===
                            'High'
                          ? '#ef4444'
                          : incident.priority ===
                            'Medium'
                          ? '#b7791f'
                          : '#16a34a',
                    }}
                  >
                    {
                      incident.priority
                    }
                  </strong>
                </span>
              </div>

              {/* STATUS */}

              <div
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  gap:
                    '7px',

                  marginBottom:
                    '18px',

                  color:
                    '#172554',
                }}
              >
                <svg
                  style={
                    iconStyle
                  }
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                  />

                  <path d="M12 7V12L15 14" />
                </svg>

                <span>
                  Status:{' '}

                  <strong
                    style={{
                      color:
                        incident.status ===
                        'Resolved'
                          ? '#16a34a'
                          : incident.status ===
                            'In Progress'
                          ? '#2563eb'
                          : '#1554c0',
                    }}
                  >
                    {
                      incident.status
                    }
                  </strong>
                </span>
              </div>

              {/* CREATED / UPDATED */}

              <div
                style={{
                  borderTop:
                    '1px solid #e5e7eb',

                  borderBottom:
                    '1px solid #e5e7eb',

                  padding:
                    '12px 0',

                  marginBottom:
                    '18px',

                  color:
                    '#64748b',

                  fontSize:
                    '13px',

                  lineHeight:
                    '1.7',
                }}
              >
                <div>
                  Created:{' '}
                  {formatDate(
                    incident.createdAt
                  )}
                </div>

                <div>
                  Updated:{' '}
                  {formatDate(
                    incident.updatedAt
                  )}
                </div>
              </div>

              {/* INCIDENT ACTIONS */}

              <div
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  gap:
                    '12px',

                  flexWrap:
                    'wrap',

                  marginBottom:
                    '24px',
                }}
              >
                {incident.status !==
                  'Resolved' && (
                    <button
                      style={{
                        backgroundColor:
                          'white',

                        color:
                          '#16a34a',

                        border:
                          '1px solid #22c55e',

                        padding:
                          '9px 14px',

                        borderRadius:
                          '6px',

                        cursor:
                          'pointer',

                        fontWeight:
                          '600',

                        fontSize:
                          '14px',
                      }}
                      onClick={() =>
                        handleStatusUpdate(
                          incident._id,
                          'Resolved'
                        )
                      }
                    >
                      ✓ Mark Resolved
                    </button>
                  )}

                {incident.status ===
                  'Open' && (
                    <button
                      style={{
                        backgroundColor:
                          'white',

                        color:
                          '#1554c0',

                        border:
                          '1px solid #2563eb',

                        padding:
                          '9px 14px',

                        borderRadius:
                          '6px',

                        cursor:
                          'pointer',

                        fontWeight:
                          '600',

                        fontSize:
                          '14px',
                      }}
                      onClick={() =>
                        handleStatusUpdate(
                          incident._id,
                          'In Progress'
                        )
                      }
                    >
                      Start Progress
                    </button>
                  )}

                <button
                  style={{
                    backgroundColor:
                      'white',

                    color:
                      '#ef4444',

                    border:
                      '1px solid #ef4444',

                    padding:
                      '9px 14px',

                    borderRadius:
                      '6px',

                    cursor:
                      'pointer',

                    fontWeight:
                      '600',

                    fontSize:
                      '14px',
                  }}
                  onClick={() =>
                    onDeleteIncident(
                      incident._id
                    )
                  }
                >
                  🗑 Delete
                </button>
              </div>

              {/* ACTIVITY */}

              <div
                style={{
                  borderTop:
                    '1px solid #e5e7eb',

                  paddingTop:
                    '20px',

                  textAlign:
                    'left',
                }}
              >
                <h4
                  style={{
                    marginTop:
                      '0',

                    marginBottom:
                      '16px',

                    color:
                      '#111827',

                    fontSize:
                      '17px',
                  }}
                >
                  Activity
                </h4>

                <div
                  style={{
                    display:
                      'flex',

                    gap:
                      '10px',

                    marginBottom:
                      '18px',

                    flexWrap:
                      'wrap',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Add a note..."
                    value={
                      noteInputs[
                        incident._id
                      ] || ''
                    }
                    onChange={(e) =>
                      handleNoteChange(
                        incident._id,
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key ===
                        'Enter'
                      ) {
                        handleAddNote(
                          incident._id
                        );
                      }
                    }}
                    style={{
                      flex:
                        '1',

                      minWidth:
                        '220px',

                      padding:
                        '10px 12px',

                      border:
                        '1px solid #cbd5e1',

                      borderRadius:
                        '6px',

                      fontSize:
                        '14px',

                      outline:
                        'none',

                      boxSizing:
                        'border-box',
                    }}
                  />

                  <button
                    onClick={() =>
                      handleAddNote(
                        incident._id
                      )
                    }
                    disabled={
                      savingNoteId ===
                      incident._id
                    }
                    style={{
                      backgroundColor:
                        savingNoteId ===
                        incident._id
                          ? '#94a3b8'
                          : '#2563eb',

                      color:
                        'white',

                      border:
                        'none',

                      padding:
                        '10px 16px',

                      borderRadius:
                        '6px',

                      cursor:
                        savingNoteId ===
                        incident._id
                          ? 'not-allowed'
                          : 'pointer',

                      fontWeight:
                        '600',

                      fontSize:
                        '14px',
                    }}
                  >
                    {savingNoteId ===
                    incident._id
                      ? 'Adding...'
                      : 'Add Note'}
                  </button>
                </div>

                {noteErrors[
                  incident._id
                ] && (
                  <div
                    style={{
                      color:
                        '#dc2626',

                      fontSize:
                        '13px',

                      marginBottom:
                        '14px',
                    }}
                  >
                    {
                      noteErrors[
                        incident._id
                      ]
                    }
                  </div>
                )}

                {sortedActivity.length ===
                0 ? (
                  <div
                    style={{
                      color:
                        '#64748b',

                      fontSize:
                        '14px',

                      padding:
                        '12px 0',
                    }}
                  >
                    No activity
                    recorded yet.
                  </div>
                ) : (
                  <div>
                    {sortedActivity.map(
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
                            display:
                              'flex',

                            gap:
                              '12px',

                            marginBottom:
                              '14px',

                            alignItems:
                              'flex-start',
                          }}
                        >
                          <div
                            style={{
                              width:
                                '10px',

                              height:
                                '10px',

                              borderRadius:
                                '50%',

                              backgroundColor:
                                activityItem.type ===
                                'note'
                                  ? '#2563eb'
                                  : activityItem.type ===
                                    'status'
                                  ? '#16a34a'
                                  : '#64748b',

                              marginTop:
                                '5px',

                              flexShrink:
                                0,
                            }}
                          />

                          <div>
                            <div
                              style={{
                                color:
                                  '#374151',

                                fontSize:
                                  '14px',

                                fontWeight:
                                  '500',
                              }}
                            >
                              {
                                activityItem.message
                              }
                            </div>

                            <div
                              style={{
                                color:
                                  '#94a3b8',

                                fontSize:
                                  '12px',

                                marginTop:
                                  '3px',
                              }}
                            >
                              {formatDate(
                                activityItem.createdAt
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                <div
                  style={{
                    marginTop:
                      '18px',

                    paddingTop:
                      '16px',

                    borderTop:
                      '1px solid #e5e7eb',

                    textAlign:
                      'center',
                  }}
                >
                  <Link
                    to={`/incidents/${incident._id}`}
                    style={{
                      display:
                        'inline-block',

                      color:
                        '#2563eb',

                      fontWeight:
                        '600',

                      fontSize:
                        '14px',

                      textDecoration:
                        'none',
                    }}
                  >
                    Open Full
                    Incident →
                  </Link>
                </div>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
};

export default Dashboard;