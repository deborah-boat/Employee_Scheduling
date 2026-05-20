// These are integration tests — they test how multiple parts work together
// Instead of testing one function in isolation, here I send a real HTTP request
// and check that the route, middleware, and response all work correctly end to end

// vitest is the test runner (describe, it, expect, vi)
import { describe, it, expect, vi } from 'vitest';

// Mock firebase-admin so tests don't need real Firebase credentials.
// 'test-token' is accepted as valid; anything else is rejected.
vi.mock('../../firebaseAdmin.js', () => ({
  default: {
    auth: () => ({
      verifyIdToken: async (token) => {
        if (token === 'test-token') return { uid: 'test-uid' };
        throw new Error('Invalid token');
      },
    }),
  },
}));

// supertest lets me send HTTP requests to the Express app without starting a real server
import request from 'supertest';

// I import the app itself so supertest can send requests directly to it
import app from '../../server.js';

describe('API Integration', () => {

  // Test 1 — GET /gyms is a public route, so anyone should be able to access it
  it('GET /gyms returns 200 and an array', async () => {
    // Send a GET request to /gyms and wait for the response
    const res = await request(app).get('/gyms');

    // 200 means OK — the server responded successfully
    expect(res.status).toBe(200);

    // The response body should be an array (the list of gyms)
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test 2 — Requesting a gym that doesn't exist should return 404 Not Found
  it('GET /gyms/:id returns 404 for an unknown ID', async () => {
    // id 999 doesn't exist in our data
    const res = await request(app).get('/gyms/999');

    // The server should tell us the resource was not found
    expect(res.status).toBe(404);
  });

  // Test 3 — POST /gyms is a protected route, so without a token it should be blocked
  it('POST /gyms without a token returns 401', async () => {
    // I'm not setting an Authorization header on purpose to test the protection
    const res = await request(app).post('/gyms').send({ name: 'Test Gym' });

    // 401 means Unauthorized — the middleware should have blocked this request
    expect(res.status).toBe(401);
  });

  // Test 4 — POST /gyms with a valid token should create the gym and return 201
  it('POST /gyms with a valid token returns 201', async () => {
    const res = await request(app)
      .post('/gyms')
      // 'test-token' is a special fake token that verifyToken accepts during tests
      // so we don't need a real Firebase account to test this
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'New Gym', location: 'Lisbon' });

    // 201 means Created — the gym was added successfully
    expect(res.status).toBe(201);

    // The response should include the gym we just sent
    expect(res.body.gym.name).toBe('New Gym');
  });

  // Test 5 — POST /gyms/:id/reviews is also protected, so no token = 401
  it('POST /gyms/:id/reviews without a token returns 401', async () => {
    // No Authorization header — verifyToken should block this
    const res = await request(app).post('/gyms/1/reviews').send({ rating: 5, text: 'Great!' });

    expect(res.status).toBe(401);
  });

});