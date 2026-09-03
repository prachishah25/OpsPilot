import React, { useState } from 'react';

const NewIncident = ({ onAddIncident }) => {
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentPriority, setIncidentPriority] = useState('');
  const [incidentStatus, setIncidentStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');

    const newIncident = {
      title: incidentTitle,
      description: incidentDescription,
      priority: incidentPriority,
      status: incidentStatus,
    };

    try {
      setIsSubmitting(true);
      setMessage('');

      const response = await fetch(
        'http://localhost:5001/api/incidents',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newIncident),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create incident');
      }

      const savedIncident = await response.json();

      onAddIncident(savedIncident);

      setIncidentTitle('');
      setIncidentDescription('');
      setIncidentPriority('');
      setIncidentStatus('');

      setMessage('Incident created successfully.');
    } catch (error) {
      console.error(error);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #cbd5e1',
    borderRadius: '7px',
    fontSize: '15px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    fontSize: '16px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#1f2937',
  };

  const selectStyle = {
    width: '100%',
    padding: '13px 45px 13px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontWeight: '500',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    outline: 'none',
    boxSizing: 'border-box',
    appearance: 'none',
    WebkitAppearance: 'none',
  };

  const arrowStyle = {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#475569',
    width: '18px',
    height: '18px',
  };

  return (
    <div
      style={{
        maxWidth: '700px',
        margin: '0 auto',
        padding: '0 30px 40px',
        boxSizing: 'border-box',
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          color: '#111827',
          fontSize: '26px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          marginBottom: '24px',
        }}
      >
        Report New Incident
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'white',
          border: '1px solid #d9dee8',
          borderRadius: '10px',
          padding: '28px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Incident Title</label>

          <input
            type="text"
            placeholder="Enter incident title"
            value={incidentTitle}
            onChange={(e) => setIncidentTitle(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Description</label>

          <textarea
            placeholder="Describe the incident"
            value={incidentDescription}
            onChange={(e) =>
              setIncidentDescription(e.target.value)
            }
            rows="5"
            style={{
              ...inputStyle,
              resize: 'vertical',
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Priority</label>

          <div
            style={{
              position: 'relative',
              width: '100%',
            }}
          >
            <select
              value={incidentPriority}
              onChange={(e) =>
                setIncidentPriority(e.target.value)
              }
              required
              style={{
                ...selectStyle,
                color:
                  incidentPriority === 'Critical'
                    ? '#dc2626'
                    : incidentPriority === 'High'
                    ? '#ea580c'
                    : incidentPriority === 'Medium'
                    ? '#b7791f'
                    : incidentPriority === 'Low'
                    ? '#16a34a'
                    : '#94a3b8',
              }}
            >
              <option value="" disabled>
                Select priority
              </option>

              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>

            <svg
              style={arrowStyle}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Status</label>

          <div
            style={{
              position: 'relative',
              width: '100%',
            }}
          >
            <select
              value={incidentStatus}
              onChange={(e) =>
                setIncidentStatus(e.target.value)
              }
              required
              style={{
                ...selectStyle,
                color:
                  incidentStatus === 'Resolved'
                    ? '#16a34a'
                    : incidentStatus === 'In Progress'
                    ? '#2563eb'
                    : incidentStatus === 'Open'
                    ? '#475569'
                    : '#94a3b8',
              }}
            >
              <option value="" disabled>
                Select status
              </option>

              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <svg
              style={arrowStyle}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            backgroundColor: isSubmitting
              ? '#94a3b8'
              : '#2563eb',
            color: 'white',
            border: 'none',
            padding: '13px 18px',
            borderRadius: '7px',
            cursor: isSubmitting
              ? 'not-allowed'
              : 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          {isSubmitting
            ? 'Submitting...'
            : 'Submit Incident'}
        </button>

        {message && (
          <p
            style={{
              textAlign: 'center',
              marginTop: '16px',
              marginBottom: '0',
              fontSize: '14px',
              fontFamily: 'Arial, Helvetica, sans-serif',
              color: message.includes('successfully')
                ? '#16a34a'
                : '#dc2626',
            }}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default NewIncident;