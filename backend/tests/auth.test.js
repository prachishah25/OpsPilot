require('dotenv').config();

const request = require('supertest');
const mongoose = require('mongoose');

const {
  MongoMemoryServer,
} = require('mongodb-memory-server');

const app = require('../app');

jest.setTimeout(60000);

let mongoServer;

beforeAll(async () => {
  mongoServer =
    await MongoMemoryServer.create();

  const mongoUri =
    mongoServer.getUri();

  await mongoose.connect(
    mongoUri
  );
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

describe('OpsPilot Auth API', () => {
  test(
    'creates a new user account',
    async () => {
      const response =
        await request(app)
          .post('/api/auth/signup')
          .send({
            name: 'Test User',
            email:
              'testuser@opspilot.com',
            password:
              'TestPassword123!',
          });

      expect(
        response.statusCode
      ).toBe(201);

      expect(
        response.body
      ).toHaveProperty(
        'message',
        'User created successfully'
      );

      expect(
        response.body
      ).toHaveProperty('user');

      expect(
        response.body.user
      ).toHaveProperty(
        'name',
        'Test User'
      );

      expect(
        response.body.user
      ).toHaveProperty(
        'email',
        'testuser@opspilot.com'
      );

      expect(
        response.body.user
      ).toHaveProperty('id');
    }
  );

  test(
    'rejects duplicate user signup',
    async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email:
            'testuser@opspilot.com',
          password:
            'TestPassword123!',
        });

      const response =
        await request(app)
          .post('/api/auth/signup')
          .send({
            name:
              'Duplicate User',
            email:
              'testuser@opspilot.com',
            password:
              'AnotherPassword123!',
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
    'logs in an existing user',
    async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email:
            'testuser@opspilot.com',
          password:
            'TestPassword123!',
        });

      const response =
        await request(app)
          .post('/api/auth/login')
          .send({
            email:
              'testuser@opspilot.com',
            password:
              'TestPassword123!',
          });

      expect(
        response.statusCode
      ).toBe(200);

      expect(
        response.body
      ).toHaveProperty('token');

      expect(
        response.body
      ).toHaveProperty('user');

      expect(
        response.body.user
      ).toHaveProperty(
        'email',
        'testuser@opspilot.com'
      );
    }
  );

  test(
    'rejects login with wrong password',
    async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email:
            'testuser@opspilot.com',
          password:
            'TestPassword123!',
        });

      const response =
        await request(app)
          .post('/api/auth/login')
          .send({
            email:
              'testuser@opspilot.com',
            password:
              'WrongPassword123!',
          });

      expect(
        response.statusCode
      ).toBe(401);
    }
  );
});