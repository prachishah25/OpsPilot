import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({
  incidents,
  onDeleteIncident,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] =
    useState('All');
  const [statusFilter, setStatusFilter] =
    useState('All');
  const [sortOption, setSortOption] =
    useState('Newest');

  const [noteInputs, setNoteInputs] = useState({});
  const [activityOverrides, setActivityOverrides] =
    useState({});
  const [savingNoteId, setSavingNoteId] =
    useState(null);
  const [noteErrors, setNoteErrors] = useState({});

  const token = localStorage.getItem('token');

  // -----------------------------------
  // ICON STYLE
  // -----------------------------------

  const iconStyle = {
    width: '18px',
    height: '18px',
    flexShrink: 0,
  };

  // -----------------------------------
  // INCIDENT STATISTICS
  // -----------------------------------

  const totalIncidents = incidents.length;

  const openIncidents = incidents.filter(
    (incident) => incident.status === 'Open'
  ).length;

  const inProgressIncidents = incidents.filter(
    (incident) =>
      incident.status === 'In Progress'
  ).length;

  const resolvedIncidents = incidents.filter(
    (incident) => incident.status === 'Resolved'
  ).length;

  const criticalIncidents = incidents.filter(
    (incident) =>
      incident.priority === 'Critical'
  ).length;

  // -----------------------------------
  // AI EVALUATION STATISTICS
  // -----------------------------------

  const helpfulAiFeedback = incidents.filter(
    (incident) =>
      incident.aiFeedback === 'helpful'
  ).length;

  const notHelpfulAiFeedback = incidents.filter(
    (incident) =>
      incident.aiFeedback === 'not_helpful'
  ).length;

  const totalAiFeedback =
    helpfulAiFeedback + notHelpfulAiFeedback;

  const aiHelpfulRate =
    totalAiFeedback === 0
      ? 0
      : Math.round(
          (helpfulAiFeedback /
            totalAiFeedback) *
            100
        );

  // -----------------------------------
  // SEARCH + FILTER
  // -----------------------------------

  const filteredIncidents = incidents.filter(
    (incident) => {
      const title =
        incident.title?.toLowerCase() || '';

      const description =
        incident.description?.toLowerCase() || '';

      const search =
        searchTerm.toLowerCase();

      const matchesSearch =
        title.includes(search) ||
        description.includes(search);

      const matchesPriority =
        priorityFilter === 'All' ||
        incident.priority ===
          priorityFilter;

      const matchesStatus =
        statusFilter === 'All' ||
        incident.status === statusFilter;

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
    if (sortOption === 'Newest') {
      return (
        new Date(b.createdAt) -
        new Date(a.createdAt)
      );
    }

    if (sortOption === 'Oldest') {
      return (
        new Date(a.createdAt) -
        new Date(b.createdAt)
      );
    }

    if (sortOption === 'Priority') {
      return (
        priorityOrder[b.priority] -
        priorityOrder[a.priority]
      );
    }

    if (sortOption === 'Status') {
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
    setPriorityFilter('All');
    setStatusFilter('All');
    setSortOption('Newest');
  };

  // -----------------------------------
  // DATE FORMATTER
  // -----------------------------------

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Not available';
    }

    return new Date(
      dateString
    ).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // -----------------------------------
  // ADD NOTE
  // -----------------------------------

  const handleNoteChange = (
    incidentId,
    value
  ) => {
    setNoteInputs((currentInputs) => ({
      ...currentInputs,
      [incidentId]: value,
    }));

    setNoteErrors((currentErrors) => ({
      ...currentErrors,
      [incidentId]: '',
    }));
  };

  const handleAddNote = async (
    incidentId
  ) => {
    const note =
      noteInputs[incidentId] || '';

    if (!note.trim()) {
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
      setSavingNoteId(incidentId);

      setNoteErrors(
        (currentErrors) => ({
          ...currentErrors,
          [incidentId]: '',
        })
      );

      const response = await fetch(
        `http://localhost:5001/api/incidents/${incidentId}/notes`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            note: note.trim(),
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

      setActivityOverrides(
        (currentActivities) => ({
          ...currentActivities,
          [incidentId]:
            data.activity || [],
        })
      );

      setNoteInputs(
        (currentInputs) => ({
          ...currentInputs,
          [incidentId]: '',
        })
      );
    } catch (error) {
      setNoteErrors(
        (currentErrors) => ({
          ...currentErrors,
          [incidentId]:
            error.message,
        })
      );
    } finally {
      setSavingNoteId(null);
    }
  };

  // -----------------------------------
  // STATUS UPDATE
  // -----------------------------------

  const handleStatusUpdate = async (
    incidentId,
    newStatus
  ) => {
    await onUpdateStatus(
      incidentId,
      newStatus
    );

    setActivityOverrides(
      (currentActivities) => {
        const updatedActivities = {
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
  // SHARED STYLES
  // -----------------------------------

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

  const aiStatCardStyle = {
    ...statCardStyle,
    minWidth: '140px',
  };

  // -----------------------------------
  // JSX
  // -----------------------------------

  return (
    <div
      className="dashboard"
      style={{
        maxWidth: '850px',
        margin: '0 auto',
        padding: '0 30px 40px',
        boxSizing: 'border-box',
      }}
    >
      <h2
        style={{
          color: '#111827',
          fontSize: '26px',
          marginBottom: '20px',
          textAlign: 'center',
        }}
      >
        Incident Dashboard
      </h2>

      {/* INCIDENT STATISTICS */}

      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <div style={statCardStyle}>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '6px',
            }}
          >
            {totalIncidents}
          </div>

          <div
            style={{
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Total
          </div>
        </div>

        <div style={statCardStyle}>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#2563eb',
              marginBottom: '6px',
            }}
          >
            {openIncidents}
          </div>

          <div
            style={{
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Open
          </div>
        </div>

        <div style={statCardStyle}>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#b7791f',
              marginBottom: '6px',
            }}
          >
            {inProgressIncidents}
          </div>

          <div
            style={{
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            In Progress
          </div>
        </div>

        <div style={statCardStyle}>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#16a34a',
              marginBottom: '6px',
            }}
          >
            {resolvedIncidents}
          </div>

          <div
            style={{
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Resolved
          </div>
        </div>

        <div style={statCardStyle}>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#dc2626',
              marginBottom: '6px',
            }}
          >
            {criticalIncidents}
          </div>

          <div
            style={{
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Critical
          </div>
        </div>
      </div>

      {/* AI EVALUATION */}

      <div
        style={{
          backgroundColor: '#f8faff',
          border:
            '1px solid #c7d7fe',
          borderRadius: '10px',
          padding: '22px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'center',
              alignItems: 'center',
              gap: '9px',
              marginBottom: '7px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor:
                  '#2563eb',
                color: 'white',
                display: 'flex',
                justifyContent:
                  'center',
                alignItems: 'center',
                fontWeight: '700',
              }}
            >
              ✦
            </div>

            <h3
              style={{
                margin: '0',
                color: '#111827',
                fontSize: '19px',
              }}
            >
              AI Evaluation
            </h3>
          </div>

          <p
            style={{
              margin: '0',
              color: '#64748b',
              fontSize: '13px',
              lineHeight: '1.6',
            }}
          >
            Measure AI Incident
            Copilot quality from
            engineer feedback.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={aiStatCardStyle}>
            <div
              style={{
                fontSize: '27px',
                fontWeight: '700',
                color: '#2563eb',
                marginBottom: '6px',
              }}
            >
              {totalAiFeedback}
            </div>

            <div
              style={{
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              AI Evaluations
            </div>
          </div>

          <div style={aiStatCardStyle}>
            <div
              style={{
                fontSize: '27px',
                fontWeight: '700',
                color: '#16a34a',
                marginBottom: '6px',
              }}
            >
              {helpfulAiFeedback}
            </div>

            <div
              style={{
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              Helpful
            </div>
          </div>

          <div style={aiStatCardStyle}>
            <div
              style={{
                fontSize: '27px',
                fontWeight: '700',
                color: '#dc2626',
                marginBottom: '6px',
              }}
            >
              {notHelpfulAiFeedback}
            </div>

            <div
              style={{
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              Not Helpful
            </div>
          </div>

          <div style={aiStatCardStyle}>
            <div
              style={{
                fontSize: '27px',
                fontWeight: '700',
                color: '#7c3aed',
                marginBottom: '6px',
              }}
            >
              {aiHelpfulRate}%
            </div>

            <div
              style={{
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              Helpful Rate
            </div>
          </div>
        </div>

        {totalAiFeedback === 0 && (
          <div
            style={{
              marginTop: '16px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '13px',
            }}
          >
            No AI feedback collected
            yet. Analyze an incident and
            rate the result.
          </div>
        )}
      </div>

      {/* SEARCH / FILTER / SORT */}

      <div
        style={{
          border:
            '1px solid #d9dee8',
          borderRadius: '8px',
          backgroundColor: 'white',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <input
          type="text"
          placeholder="Search incidents..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(
              e.target.value
            )
          }
          style={{
            ...inputStyle,
            marginBottom: '14px',
          }}
        />

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(
                e.target.value
              )
            }
            style={{
              ...inputStyle,
              flex: '1',
              minWidth: '180px',
              cursor: 'pointer',
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
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            style={{
              ...inputStyle,
              flex: '1',
              minWidth: '180px',
              cursor: 'pointer',
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
            value={sortOption}
            onChange={(e) =>
              setSortOption(
                e.target.value
              )
            }
            style={{
              ...inputStyle,
              flex: '1',
              minWidth: '180px',
              cursor: 'pointer',
            }}
          >
            <option value="Newest">
              Newest First
            </option>

            <option value="Oldest">
              Oldest First
            </option>

            <option value="Priority">
              Priority: Critical → Low
            </option>

            <option value="Status">
              Status: Open → In Progress
              → Resolved
            </option>
          </select>
        </div>

        <button
          onClick={clearFilters}
          style={{
            width: '100%',
            marginTop: '14px',
            backgroundColor: 'white',
            color: '#2563eb',
            border:
              '1px solid #2563eb',
            padding: '10px 14px',
            borderRadius: '7px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* NUMBER OF INCIDENTS */}

      <p
        style={{
          textAlign: 'center',
          color: '#64748b',
          marginBottom: '18px',
          fontSize: '14px',
        }}
      >
        Showing {sortedIncidents.length}{' '}
        of {incidents.length} incidents
      </p>

      {/* NO RESULTS */}

      {sortedIncidents.length === 0 && (
        <div
          style={{
            border:
              '1px solid #d9dee8',
            borderRadius: '8px',
            padding: '30px',
            textAlign: 'center',
            color: '#64748b',
            backgroundColor: 'white',
          }}
        >
          No incidents match your
          search or filters.
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

          const sortedActivity = [
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
              key={incident._id}
              style={{
                border:
                  '1px solid #d9dee8',
                padding: '24px',
                marginBottom: '20px',
                borderRadius: '8px',
                width: '100%',
                boxSizing:
                  'border-box',
                backgroundColor:
                  'white',
                textAlign: 'center',
              }}
            >
              {/* TITLE */}

              <Link
                to={`/incidents/${incident._id}`}
                style={{
                  textDecoration:
                    'none',
                }}
              >
                <h3
                  style={{
                    color: '#1f2937',
                    marginTop: '0',
                    marginBottom:
                      '8px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {incident.title}
                </h3>
              </Link>

              {/* VIEW DETAILS */}

              <Link
                to={`/incidents/${incident._id}`}
                style={{
                  display:
                    'inline-block',
                  marginBottom: '18px',
                  color: '#2563eb',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration:
                    'none',
                }}
              >
                View Details →
              </Link>

              {/* DESCRIPTION */}

              <p
                style={{
                  color: '#374151',
                  marginTop: '0',
                  marginBottom: '18px',
                  lineHeight: '1.6',
                }}
              >
                {incident.description}
              </p>

              {/* PRIORITY */}

              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  gap: '7px',
                  marginBottom:
                    '16px',
                  color: '#172554',
                }}
              >
                <svg
                  style={iconStyle}
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
                    {incident.priority}
                  </strong>
                </span>
              </div>

              {/* STATUS */}

              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  gap: '7px',
                  marginBottom:
                    '18px',
                  color: '#172554',
                }}
              >
                <svg
                  style={iconStyle}
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
                    {incident.status}
                  </strong>
                </span>
              </div>

              {/* AI FEEDBACK BADGE */}

              {incident.aiFeedback && (
                <div
                  style={{
                    display:
                      'inline-block',
                    marginBottom:
                      '18px',
                    padding:
                      '6px 11px',
                    borderRadius:
                      '20px',
                    backgroundColor:
                      incident.aiFeedback ===
                      'helpful'
                        ? '#f0fdf4'
                        : '#fef2f2',
                    color:
                      incident.aiFeedback ===
                      'helpful'
                        ? '#15803d'
                        : '#b91c1c',
                    border:
                      incident.aiFeedback ===
                      'helpful'
                        ? '1px solid #bbf7d0'
                        : '1px solid #fecaca',
                    fontSize: '12px',
                    fontWeight: '700',
                  }}
                >
                  {incident.aiFeedback ===
                  'helpful'
                    ? '👍 AI Helpful'
                    : '👎 AI Not Helpful'}
                </div>
              )}

              {/* CREATED / UPDATED */}

              <div
                style={{
                  borderTop:
                    '1px solid #e5e7eb',
                  borderBottom:
                    '1px solid #e5e7eb',
                  padding: '12px 0',
                  marginBottom:
                    '18px',
                  color: '#64748b',
                  fontSize: '13px',
                  lineHeight: '1.7',
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

              {/* ACTIONS */}

              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  gap: '12px',
                  flexWrap: 'wrap',
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
                      color: '#16a34a',
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
                      color: '#1554c0',
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
                    color: '#ef4444',
                    border:
                      '1px solid #ef4444',
                    padding:
                      '9px 14px',
                    borderRadius:
                      '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
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
                  paddingTop: '20px',
                  textAlign: 'left',
                }}
              >
                <h4
                  style={{
                    marginTop: '0',
                    marginBottom:
                      '16px',
                    color: '#111827',
                    fontSize: '17px',
                  }}
                >
                  Activity
                </h4>

                {/* ADD NOTE */}

                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom:
                      '18px',
                    flexWrap: 'wrap',
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
                      flex: '1',
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
                      outline: 'none',
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
                      color: 'white',
                      border: 'none',
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

                {/* NOTE ERROR */}

                {noteErrors[
                  incident._id
                ] && (
                  <div
                    style={{
                      color: '#dc2626',
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

                {/* ACTIVITY TIMELINE */}

                {sortedActivity.length ===
                0 ? (
                  <div
                    style={{
                      color: '#64748b',
                      fontSize:
                        '14px',
                      padding:
                        '12px 0',
                    }}
                  >
                    No activity recorded
                    yet.
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
                            gap: '12px',
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

                {/* FULL INCIDENT LINK */}

                <div
                  style={{
                    marginTop: '18px',
                    paddingTop: '16px',
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
                      color: '#2563eb',
                      fontWeight:
                        '600',
                      fontSize:
                        '14px',
                      textDecoration:
                        'none',
                    }}
                  >
                    Open Full Incident →
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