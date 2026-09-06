import React, {
  useState,
  useEffect,
} from 'react';

import {
  BrowserRouter,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom';

import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import NewIncident from './pages/NewIncident';
import IncidentDetails from './pages/IncidentDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';

const App = () => {
  const [
    incidents,
    setIncidents,
  ] = useState([]);

  const [
    realtimeStatus,
    setRealtimeStatus,
  ] = useState('connecting');

  const token =
    localStorage.getItem(
      'token'
    );

  // -----------------------------------
  // INCIDENT STATE HELPERS
  // -----------------------------------

  const upsertIncident = (
    incomingIncident
  ) => {
    if (
      !incomingIncident ||
      !incomingIncident._id
    ) {
      return;
    }

    setIncidents(
      (currentIncidents) => {
        const exists =
          currentIncidents.some(
            (incident) =>
              incident._id ===
              incomingIncident._id
          );

        if (exists) {
          return currentIncidents.map(
            (incident) =>
              incident._id ===
              incomingIncident._id
                ? incomingIncident
                : incident
          );
        }

        return [
          incomingIncident,
          ...currentIncidents,
        ];
      }
    );
  };

  const removeIncidentFromState = (
    incidentId
  ) => {
    if (!incidentId) {
      return;
    }

    setIncidents(
      (currentIncidents) =>
        currentIncidents.filter(
          (incident) =>
            incident._id !==
            String(incidentId)
        )
    );
  };

  // -----------------------------------
  // LOAD INCIDENTS
  // -----------------------------------

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchIncidents =
      async () => {
        try {
          const response =
            await fetch(
              'http://localhost:5001/api/incidents',
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          if (!response.ok) {
            throw new Error(
              'Failed to fetch incidents'
            );
          }

          const data =
            await response.json();

          setIncidents(data);
        } catch (error) {
          console.error(
            'Error fetching incidents:',
            error
          );
        }
      };

    fetchIncidents();
  }, [token]);

  // -----------------------------------
  // REAL-TIME SSE CONNECTION
  // -----------------------------------

  useEffect(() => {
    if (!token) {
      setRealtimeStatus(
        'disconnected'
      );

      return undefined;
    }

    let stopped = false;

    let reconnectTimeoutId =
      null;

    let abortController =
      null;

    const connectToStream =
      async () => {
        if (stopped) {
          return;
        }

        setRealtimeStatus(
          'connecting'
        );

        abortController =
          new AbortController();

        try {
          console.log(
            'Connecting to OpsPilot real-time stream...'
          );

          const response =
            await fetch(
              'http://localhost:5001/api/realtime/stream',
              {
                method: 'GET',

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  Accept:
                    'text/event-stream',
                },

                signal:
                  abortController.signal,
              }
            );

          if (!response.ok) {
            throw new Error(
              `Real-time stream failed with status ${response.status}`
            );
          }

          if (!response.body) {
            throw new Error(
              'Real-time stream body is unavailable'
            );
          }

          setRealtimeStatus(
            'live'
          );

          console.log(
            'OpsPilot real-time stream connected'
          );

          const reader =
            response.body.getReader();

          const decoder =
            new TextDecoder(
              'utf-8'
            );

          let buffer = '';

          while (!stopped) {
            const {
              value,
              done,
            } = await reader.read();

            if (done) {
              break;
            }

            buffer +=
              decoder.decode(
                value,
                {
                  stream: true,
                }
              );

            const messages =
              buffer.split(
                '\n\n'
              );

            buffer =
              messages.pop() ||
              '';

            messages.forEach(
              (message) => {
                if (
                  !message.trim()
                ) {
                  return;
                }

                const lines =
                  message.split(
                    '\n'
                  );

                let eventName =
                  'message';

                const dataLines =
                  [];

                lines.forEach(
                  (line) => {
                    if (
                      line.startsWith(
                        'event:'
                      )
                    ) {
                      eventName =
                        line
                          .slice(
                            6
                          )
                          .trim();
                    }

                    if (
                      line.startsWith(
                        'data:'
                      )
                    ) {
                      dataLines.push(
                        line
                          .slice(
                            5
                          )
                          .trim()
                      );
                    }
                  }
                );

                if (
                  dataLines.length ===
                  0
                ) {
                  return;
                }

                const rawData =
                  dataLines.join(
                    '\n'
                  );

                let data;

                try {
                  data =
                    JSON.parse(
                      rawData
                    );
                } catch (error) {
                  console.error(
                    'Failed to parse real-time event:',
                    error
                  );

                  return;
                }

                if (
                  eventName ===
                  'connected'
                ) {
                  setRealtimeStatus(
                    'live'
                  );

                  console.log(
                    'Real-time connection confirmed:',
                    data
                  );

                  return;
                }

                if (
                  eventName ===
                  'heartbeat'
                ) {
                  setRealtimeStatus(
                    'live'
                  );

                  return;
                }

                if (
                  eventName ===
                  'incident_created'
                ) {
                  console.log(
                    'Real-time incident created:',
                    data
                  );

                  upsertIncident(
                    data.incident
                  );

                  return;
                }

                if (
                  eventName ===
                  'incident_updated'
                ) {
                  console.log(
                    'Real-time incident updated:',
                    data
                  );

                  upsertIncident(
                    data.incident
                  );

                  return;
                }

                if (
                  eventName ===
                  'incident_deleted'
                ) {
                  console.log(
                    'Real-time incident deleted:',
                    data
                  );

                  removeIncidentFromState(
                    String(
                      data.incidentId
                    )
                  );
                }
              }
            );
          }
        } catch (error) {
          if (
            error.name ===
              'AbortError' ||
            stopped
          ) {
            return;
          }

          setRealtimeStatus(
            'disconnected'
          );

          console.error(
            'Real-time stream error:',
            error
          );
        }

        if (!stopped) {
          setRealtimeStatus(
            'connecting'
          );

          console.log(
            'Real-time stream disconnected. Reconnecting...'
          );

          reconnectTimeoutId =
            setTimeout(
              connectToStream,
              3000
            );
        }
      };

    connectToStream();

    return () => {
      stopped = true;

      setRealtimeStatus(
        'disconnected'
      );

      if (
        reconnectTimeoutId
      ) {
        clearTimeout(
          reconnectTimeoutId
        );
      }

      if (
        abortController
      ) {
        abortController.abort();
      }
    };
  }, [token]);

  // -----------------------------------
  // ADD INCIDENT
  // -----------------------------------

  const addIncident = (
    newIncident
  ) => {
    upsertIncident(
      newIncident
    );
  };

  // -----------------------------------
  // DELETE INCIDENT
  // -----------------------------------

  const deleteIncident =
    async (id) => {
      try {
        const response =
          await fetch(
            `http://localhost:5001/api/incidents/${id}`,
            {
              method:
                'DELETE',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (!response.ok) {
          throw new Error(
            'Failed to delete incident'
          );
        }

        removeIncidentFromState(
          id
        );

        return true;
      } catch (error) {
        console.error(
          'Error deleting incident:',
          error
        );

        return false;
      }
    };

  // -----------------------------------
  // UPDATE STATUS
  // -----------------------------------

  const updateIncidentStatus =
    async (
      id,
      newStatus
    ) => {
      try {
        const response =
          await fetch(
            `http://localhost:5001/api/incidents/${id}`,
            {
              method:
                'PUT',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  status:
                    newStatus,
                }),
            }
          );

        if (!response.ok) {
          throw new Error(
            'Failed to update incident'
          );
        }

        const updatedIncident =
          await response.json();

        upsertIncident(
          updatedIncident
        );

        return updatedIncident;
      } catch (error) {
        console.error(
          'Error updating incident:',
          error
        );

        return null;
      }
    };

  // -----------------------------------
  // UPDATE INCIDENT
  // -----------------------------------

  const updateIncident = (
    updatedIncident
  ) => {
    upsertIncident(
      updatedIncident
    );
  };

  // -----------------------------------
  // ROUTES
  // -----------------------------------

  return (
    <BrowserRouter>
      <Header />

      <Switch>
        <Route
          exact
          path="/"
        >
          {token ? (
            <Dashboard
              incidents={
                incidents
              }
              onDeleteIncident={
                deleteIncident
              }
              onUpdateStatus={
                updateIncidentStatus
              }
              realtimeStatus={
                realtimeStatus
              }
            />
          ) : (
            <Redirect to="/auth" />
          )}
        </Route>

        <Route
          exact
          path="/incidents/new"
        >
          {token ? (
            <NewIncident
              onAddIncident={
                addIncident
              }
            />
          ) : (
            <Redirect to="/auth" />
          )}
        </Route>

        <Route path="/incidents/:id">
          {token ? (
            <IncidentDetails
              incidents={
                incidents
              }
              onDeleteIncident={
                deleteIncident
              }
              onUpdateStatus={
                updateIncidentStatus
              }
              onUpdateIncident={
                updateIncident
              }
            />
          ) : (
            <Redirect to="/auth" />
          )}
        </Route>

        <Route path="/auth">
          <Login />
        </Route>

        <Route path="/signup">
          <Signup />
        </Route>
      </Switch>
    </BrowserRouter>
  );
};

export default App;