import React, { useState, useEffect } from 'react';
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
  const [incidents, setIncidents] = useState([]);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchIncidents = async () => {
      try {
        const response = await fetch(
          'http://localhost:5001/api/incidents',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch incidents');
        }

        const data = await response.json();

        setIncidents(data);
      } catch (error) {
        console.error('Error fetching incidents:', error);
      }
    };

    fetchIncidents();
  }, [token]);

  const addIncident = (newIncident) => {
    setIncidents((currentIncidents) => [
      ...currentIncidents,
      newIncident,
    ]);
  };

  const deleteIncident = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/incidents/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete incident');
      }

      setIncidents((currentIncidents) =>
        currentIncidents.filter(
          (incident) => incident._id !== id
        )
      );

      return true;
    } catch (error) {
      console.error('Error deleting incident:', error);
      return false;
    }
  };

  const updateIncidentStatus = async (id, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/incidents/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update incident');
      }

      const updatedIncident = await response.json();

      setIncidents((currentIncidents) =>
        currentIncidents.map((incident) =>
          incident._id === id
            ? updatedIncident
            : incident
        )
      );

      return updatedIncident;
    } catch (error) {
      console.error('Error updating incident:', error);
      return null;
    }
  };

  const updateIncident = (updatedIncident) => {
    setIncidents((currentIncidents) =>
      currentIncidents.map((incident) =>
        incident._id === updatedIncident._id
          ? updatedIncident
          : incident
      )
    );
  };

  return (
    <BrowserRouter>
      <Header />

      <Switch>
        <Route exact path="/">
          {token ? (
            <Dashboard
              incidents={incidents}
              onDeleteIncident={deleteIncident}
              onUpdateStatus={updateIncidentStatus}
            />
          ) : (
            <Redirect to="/auth" />
          )}
        </Route>

        <Route exact path="/incidents/new">
          {token ? (
            <NewIncident onAddIncident={addIncident} />
          ) : (
            <Redirect to="/auth" />
          )}
        </Route>

        <Route path="/incidents/:id">
          {token ? (
            <IncidentDetails
              incidents={incidents}
              onDeleteIncident={deleteIncident}
              onUpdateStatus={updateIncidentStatus}
              onUpdateIncident={updateIncident}
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