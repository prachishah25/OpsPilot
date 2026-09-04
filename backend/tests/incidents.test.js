require('dotenv').config();

const request = require('supertest');
const mongoose = require('mongoose');

const {
  MongoMemoryServer,
} = require('mongodb-memory-server');

const app = require('../app');

jest.setTimeout(60000);

let mongoServer;

const createAndLoginUser = async ({
  name,
  email,
  password,
}) => {
  await request(app)
    .post('/api/auth/signup')
    .send({
      name,
      email,
      password,
    });

  const loginResponse =
    await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password,
      });

  return loginResponse.body.token;
};

const createIncident = async (
  token,
  overrides = {}
) => {
  const incidentData = {
    title: 'Database Connection Failure',
    description:
      'Production database connections are failing.',
    priority: 'High',
    status: 'Open',
    ...overrides,
  };

  return request(app)
    .post('/api/incidents')
    .set(
      'Authorization',
      `Bearer ${token}`
    )
    .send(incidentData);
};

beforeAll(async () => {
  mongoServer =
    await MongoMemoryServer.create();

  const mongoUri =
    mongoServer.getUri();

  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  const collections =
    mongoose.connection.collections;

  for (const key in collections) {
    await collections[
      key
    ].deleteMany({});
  }
});

afterAll(async () => {
  if (
    mongoose.connection.readyState !==
    0
  ) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('OpsPilot Incident API', () => {
  test(
    'rejects incident requests without authentication',
    async () => {
      const response =
        await request(app)
          .get('/api/incidents');

      expect(
        response.statusCode
      ).toBe(401);
    }
  );

  test(
    'rejects requests with an invalid JWT',
    async () => {
      const response =
        await request(app)
          .get('/api/incidents')
          .set(
            'Authorization',
            'Bearer invalid-token'
          );

      expect(
        response.statusCode
      ).toBe(401);
    }
  );

  test(
    'creates a new incident for an authenticated user',
    async () => {
      const token =
        await createAndLoginUser({
          name: 'Test User',
          email:
            'testuser@opspilot.com',
          password:
            'TestPassword123!',
        });

      const response =
        await createIncident(token);

      expect(
        response.statusCode
      ).toBe(201);

      expect(
        response.body
      ).toHaveProperty('_id');

      expect(
        response.body.title
      ).toBe(
        'Database Connection Failure'
      );

      expect(
        response.body.priority
      ).toBe('High');

      expect(
        response.body.status
      ).toBe('Open');
    }
  );

  test(
    'rejects an incident with missing required data',
    async () => {
      const token =
        await createAndLoginUser({
          name: 'Test User',
          email:
            'testuser@opspilot.com',
          password:
            'TestPassword123!',
        });

      const response =
        await request(app)
          .post('/api/incidents')
          .set(
            'Authorization',
            `Bearer ${token}`
          )
          .send({
            title: '',
            description: '',
            priority: 'High',
            status: 'Open',
          });

      expect(
        response.statusCode
      ).toBeGreaterThanOrEqual(400);

      expect(
        response.statusCode
      ).toBeLessThan(500);
    }
  );

  test(
    'returns incidents belonging to the logged-in user',
    async () => {
      const token =
        await createAndLoginUser({
          name: 'Test User',
          email:
            'testuser@opspilot.com',
          password:
            'TestPassword123!',
        });

      await createIncident(
        token,
        {
          title: 'API Service Down',
          description:
            'The production API is unavailable.',
          priority: 'Critical',
        }
      );

      const response =
        await request(app)
          .get('/api/incidents')
          .set(
            'Authorization',
            `Bearer ${token}`
          );

      expect(
        response.statusCode
      ).toBe(200);

      expect(
        Array.isArray(
          response.body
        )
      ).toBe(true);

      expect(
        response.body.length
      ).toBe(1);

      expect(
        response.body[0].title
      ).toBe(
        'API Service Down'
      );
    }
  );

  test(
    'updates an existing incident',
    async () => {
      const token =
        await createAndLoginUser({
          name: 'Test User',
          email:
            'testuser@opspilot.com',
          password:
            'TestPassword123!',
        });

      const createResponse =
        await createIncident(
          token,
          {
            title:
              'Slow API Response',
            description:
              'API latency is above normal.',
            priority: 'Medium',
          }
        );

      const incidentId =
        createResponse.body._id;

      const updateResponse =
        await request(app)
          .put(
            `/api/incidents/${incidentId}`
          )
          .set(
            'Authorization',
            `Bearer ${token}`
          )
          .send({
            title:
              'Slow API Response',
            description:
              'API latency is above normal.',
            priority: 'High',
            status:
              'In Progress',
          });

      expect(
        updateResponse.statusCode
      ).toBe(200);

      expect(
        updateResponse.body.status
      ).toBe(
        'In Progress'
      );

      expect(
        updateResponse.body.priority
      ).toBe('High');
    }
  );

  test(
    'deletes an incident',
    async () => {
      const token =
        await createAndLoginUser({
          name: 'Test User',
          email:
            'testuser@opspilot.com',
          password:
            'TestPassword123!',
        });

      const createResponse =
        await createIncident(
          token,
          {
            title:
              'Temporary Incident',
            description:
              'This incident will be deleted.',
            priority: 'Low',
          }
        );

      const incidentId =
        createResponse.body._id;

      const deleteResponse =
        await request(app)
          .delete(
            `/api/incidents/${incidentId}`
          )
          .set(
            'Authorization',
            `Bearer ${token}`
          );

      expect(
        deleteResponse.statusCode
      ).toBe(200);

      const getResponse =
        await request(app)
          .get('/api/incidents')
          .set(
            'Authorization',
            `Bearer ${token}`
          );

      expect(
        getResponse.body.length
      ).toBe(0);
    }
  );

  test(
    'prevents one user from reading another user incident',
    async () => {
      const userOneToken =
        await createAndLoginUser({
          name: 'User One',
          email:
            'userone@opspilot.com',
          password:
            'UserOnePassword123!',
        });

      const userTwoToken =
        await createAndLoginUser({
          name: 'User Two',
          email:
            'usertwo@opspilot.com',
          password:
            'UserTwoPassword123!',
        });

      const createResponse =
        await createIncident(
          userOneToken,
          {
            title:
              'Private Incident',
            description:
              'This belongs only to User One.',
          }
        );

      const incidentId =
        createResponse.body._id;

      const response =
        await request(app)
          .get(
            `/api/incidents/${incidentId}`
          )
          .set(
            'Authorization',
            `Bearer ${userTwoToken}`
          );

      expect(
        [403, 404]
      ).toContain(
        response.statusCode
      );
    }
  );

  test(
    'prevents one user from updating another user incident',
    async () => {
      const userOneToken =
        await createAndLoginUser({
          name: 'User One',
          email:
            'userone@opspilot.com',
          password:
            'UserOnePassword123!',
        });

      const userTwoToken =
        await createAndLoginUser({
          name: 'User Two',
          email:
            'usertwo@opspilot.com',
          password:
            'UserTwoPassword123!',
        });

      const createResponse =
        await createIncident(
          userOneToken,
          {
            title:
              'Private Incident',
            description:
              'User Two must not edit this.',
          }
        );

      const incidentId =
        createResponse.body._id;

      const response =
        await request(app)
          .put(
            `/api/incidents/${incidentId}`
          )
          .set(
            'Authorization',
            `Bearer ${userTwoToken}`
          )
          .send({
            title:
              'Hacked Incident',
            description:
              'This should not be allowed.',
            priority: 'Critical',
            status: 'Resolved',
          });

      expect(
        [403, 404]
      ).toContain(
        response.statusCode
      );
    }
  );

  test(
    'prevents one user from deleting another user incident',
    async () => {
      const userOneToken =
        await createAndLoginUser({
          name: 'User One',
          email:
            'userone@opspilot.com',
          password:
            'UserOnePassword123!',
        });

      const userTwoToken =
        await createAndLoginUser({
          name: 'User Two',
          email:
            'usertwo@opspilot.com',
          password:
            'UserTwoPassword123!',
        });

      const createResponse =
        await createIncident(
          userOneToken,
          {
            title:
              'Do Not Delete',
            description:
              'Only User One owns this incident.',
          }
        );

      const incidentId =
        createResponse.body._id;

      const response =
        await request(app)
          .delete(
            `/api/incidents/${incidentId}`
          )
          .set(
            'Authorization',
            `Bearer ${userTwoToken}`
          );

      expect(
        [403, 404]
      ).toContain(
        response.statusCode
      );

      const ownerCheck =
        await request(app)
          .get(
            `/api/incidents/${incidentId}`
          )
          .set(
            'Authorization',
            `Bearer ${userOneToken}`
          );

      expect(
        ownerCheck.statusCode
      ).toBe(200);
    }
  );

  test(
    'adds a note to an incident and records it in activity',
    async () => {
      const token =
        await createAndLoginUser({
          name: 'Test User',
          email:
            'testuser@opspilot.com',
          password:
            'TestPassword123!',
        });

      const createResponse =
        await createIncident(token);

      const incidentId =
        createResponse.body._id;

      const noteResponse =
        await request(app)
          .post(
            `/api/incidents/${incidentId}/notes`
          )
          .set(
            'Authorization',
            `Bearer ${token}`
          )
          .send({
            note:
              'Database service restarted successfully.',
          });

      expect(
        noteResponse.statusCode
      ).toBe(200);

      const getResponse =
        await request(app)
          .get(
            `/api/incidents/${incidentId}`
          )
          .set(
            'Authorization',
            `Bearer ${token}`
          );

      expect(
        getResponse.statusCode
      ).toBe(200);

      expect(
        Array.isArray(
          getResponse.body.activity
        )
      ).toBe(true);

      const noteActivity =
        getResponse.body.activity.find(
          (activityItem) =>
            activityItem.type ===
            'note'
        );

      expect(
        noteActivity
      ).toBeDefined();

      expect(
        noteActivity.message
      ).toContain(
        'Database service restarted successfully.'
      );
    }
  );

  test(
    'returns 404 for a valid but nonexistent incident ID',
    async () => {
      const token =
        await createAndLoginUser({
          name: 'Test User',
          email:
            'testuser@opspilot.com',
          password:
            'TestPassword123!',
        });

      const nonexistentId =
        new mongoose.Types.ObjectId();

      const response =
        await request(app)
          .get(
            `/api/incidents/${nonexistentId}`
          )
          .set(
            'Authorization',
            `Bearer ${token}`
          );

      expect(
        response.statusCode
      ).toBe(404);
    }
  );
});