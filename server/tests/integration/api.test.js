// Integration tests: we send real HTTP requests to the app and check the responses.
// We use fake versions of the database and bcrypt so we don't need a real database.

// vitest is our test framework - describe/it/expect are the main building blocks
import { describe, it, expect, vi, beforeEach } from 'vitest';

// supertest lets us send HTTP requests to the app without starting a real server
import request from 'supertest';

// createApp builds the Express app - we import it so we can test it directly
import { createApp } from '../../app.js';

// ─── Fake dependencies ────────────────────────────────────────────────────────

// vi.fn() creates a fake function that we can control - it does nothing by default
// We use this instead of real bcrypt so we don't need to hash real passwords in tests
const mockBcrypt = { compare: vi.fn() };

// This is a fake version of Prisma (our database client)
// Each vi.fn() replaces a real database query - we tell them what to return per test
const mockPrisma = {
  user: {
    findFirst: vi.fn()       // fake "find a user in the database"
  },
  employee: {
    findMany: vi.fn(),       // fake "get all employees"
    findFirst: vi.fn(),      // fake "find one employee"
    create: vi.fn(),         // fake "add a new employee"
    delete: vi.fn()          // fake "remove an employee"
  },
  availability: {
    findMany: vi.fn(),       // fake "get all availability records"
    findFirst: vi.fn(),      // fake "find one availability record"
    create: vi.fn(),         // fake "create a new availability record"
    update: vi.fn()          // fake "update an existing availability record"
  },
  shiftInstances: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn()
  },
  employeeShift: {
    findFirst: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn()
  },
  $disconnect: vi.fn()
};

// Build the app with our fakes injected
// requiresAuth is replaced with a pass-through so Auth0 doesn't block our tests
const testApp = createApp(mockPrisma, {
  bcrypt: mockBcrypt,
  requiresAuth: () => (_req, _res, next) => next() // skip auth for all tests
});

// Before every single test: clear all fake call history and set safe default return values
// This prevents one test's data from accidentally affecting the next test
beforeEach(() => {
  vi.clearAllMocks();                                          // forget all previous calls
  mockPrisma.employee.findMany.mockResolvedValue([]);          // default: empty list
  mockPrisma.employee.findFirst.mockResolvedValue(null);       // default: not found
  mockPrisma.employee.delete.mockResolvedValue({});
  mockPrisma.availability.findMany.mockResolvedValue([]);
  mockPrisma.availability.findFirst.mockResolvedValue(null);
  mockPrisma.shiftInstances.findMany.mockResolvedValue([]);
  mockPrisma.shiftInstances.findFirst.mockResolvedValue(null);
  mockPrisma.employeeShift.findFirst.mockResolvedValue(null);
  mockPrisma.employeeShift.create.mockResolvedValue({});
  mockPrisma.employeeShift.deleteMany.mockResolvedValue({});
});

// ─── Health check ─────────────────────────────────────────────────────────────

// Just checks that the server is running and responding
describe('GET /api/health', () => {
  it('returns 200 and { status: "ok" }', async () => {
    const res = await request(testApp).get('/api/health');
    expect(res.status).toBe(200);           // 200 means OK
    expect(res.body).toEqual({ status: 'ok' });
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe('POST /api/login', () => {
  // Missing password → should get a 400 Bad Request
  it('returns 400 when required fields are missing', async () => {
    const res = await request(testApp).post('/api/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i); // message should mention "required"
  });

  // "admin" is not a valid role - only "employee" or "employer" are allowed
  it('returns 400 when role is not "employee" or "employer"', async () => {
    const res = await request(testApp)
      .post('/api/login')
      .send({ email: 'a@b.com', password: 'secret', role: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/role/i);
  });

  // The fake database returns null, meaning no user was found
  it('returns 401 when the user does not exist in the database', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null); // pretend user doesn't exist
    const res = await request(testApp)
      .post('/api/login')
      .send({ email: 'ghost@example.com', password: 'secret', role: 'employee' });
    expect(res.status).toBe(401); // 401 = Unauthorized
    expect(res.body.message).toBe('Invalid credentials');
  });

  // User exists in the database but bcrypt says the password doesn't match
  it('returns 401 when the password is wrong', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 1, email: 'ellen@example.com', role: 'employee',
      password: '$hashed', displayName: 'Ellen'
    });
    mockBcrypt.compare.mockResolvedValue(false); // pretend password check fails
    const res = await request(testApp)
      .post('/api/login')
      .send({ email: 'ellen@example.com', password: 'wrong', role: 'employee' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  // Everything is correct - should get back user info
  it('returns 200 with user info on successful login', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 1, email: 'ellen@example.com', role: 'employee',
      password: '$hashed', displayName: 'Ellen Johansson'
    });
    mockBcrypt.compare.mockResolvedValue(true); // pretend password matches
    const res = await request(testApp)
      .post('/api/login')
      .send({ email: 'ellen@example.com', password: 'correct', role: 'employee' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.user.email).toBe('ellen@example.com');
    expect(res.body.user.role).toBe('employee');
  });
});

// ─── Employees ────────────────────────────────────────────────────────────────

describe('GET /employees', () => {
  it('returns 200 and an array', async () => {
    // Tell the fake database to return one employee
    mockPrisma.employee.findMany.mockResolvedValue([
      { id: 1, name: 'Ellen Johansson', email: 'ellen@example.com', shifts: [] }
    ]);
    const res = await request(testApp).get('/employees');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true); // response should be an array
    expect(res.body[0].name).toBe('Ellen Johansson');
  });
});

describe('POST /employees', () => {
  // Only employers can add employees - no x-role header means access denied
  it('returns 403 when x-role header is not "employer"', async () => {
    const res = await request(testApp)
      .post('/employees')
      .send({ name: 'New Worker', email: 'new@example.com' });
    expect(res.status).toBe(403); // 403 = Forbidden
  });

  // Missing email → validation should reject this
  it('returns 400 when the request body fails validation', async () => {
    const res = await request(testApp)
      .post('/employees')
      .set('x-role', 'employer')
      .send({ name: 'No Email' }); // email is missing
    expect(res.status).toBe(400);
  });

  // Valid data with correct role → employee should be created
  it('returns 201 with the created employee when input is valid', async () => {
    const created = { id: 6, name: 'Sara Berg', email: 'sara@example.com' };
    mockPrisma.employee.create.mockResolvedValue(created); // fake database saves and returns the new employee
    const res = await request(testApp)
      .post('/employees')
      .set('x-role', 'employer')
      .send({ name: 'Sara Berg', email: 'sara@example.com' });
    expect(res.status).toBe(201); // 201 = Created
    expect(res.body.name).toBe('Sara Berg');
  });
});

describe('DELETE /employees/:id', () => {
  // Only employers can delete employees
  it('returns 403 when x-role is not "employer"', async () => {
    const res = await request(testApp).delete('/employees/1');
    expect(res.status).toBe(403);
  });

  // "abc" is not a valid number - should get a 400
  it('returns 400 when the id is not a valid number', async () => {
    const res = await request(testApp)
      .delete('/employees/abc')
      .set('x-role', 'employer');
    expect(res.status).toBe(400);
  });

  // Valid id + employer role → employee deleted, no body returned
  it('returns 204 when the employee is deleted successfully', async () => {
    const res = await request(testApp)
      .delete('/employees/1')
      .set('x-role', 'employer');
    expect(res.status).toBe(204); // 204 = No Content (success, nothing to return)
  });
});

// ─── Availability ─────────────────────────────────────────────────────────────

describe('GET /availability/:id', () => {
  // "abc" is not a valid employee id
  it('returns 400 when the id is not a valid number', async () => {
    const res = await request(testApp).get('/availability/abc');
    expect(res.status).toBe(400);
  });

  it('returns 200 and the availability array for a valid employee id', async () => {
    // Pretend the database has one availability record for employee 1
    mockPrisma.availability.findMany.mockResolvedValue([
      { id: 1, employeeId: 1, shift_id: 1, date: '2026-05-20', status: 'available' }
    ]);
    const res = await request(testApp).get('/availability/1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('PUT /availability/:id', () => {
  it('returns 400 when the id is not a valid number', async () => {
    const res = await request(testApp)
      .put('/availability/xyz')
      .send({ date: '2026-05-20', shift_id: 1, status: 'available' });
    expect(res.status).toBe(400);
  });

  // shift_id is missing - Zod schema validation should catch this
  it('returns 400 when the body fails Zod validation', async () => {
    const res = await request(testApp)
      .put('/availability/1')
      .send({ date: '2026-05-20', status: 'available' }); // shift_id missing
    expect(res.status).toBe(400);
  });

  // No existing record → should create a new one and return it
  it('returns 200 and creates a new availability record when none exists', async () => {
    const record = { id: 1, employeeId: 1, shift_id: 1, date: '2026-05-20', status: 'available' };
    mockPrisma.availability.findFirst.mockResolvedValue(null);    // no existing record
    mockPrisma.availability.create.mockResolvedValue(record);     // fake create returns our record
    const res = await request(testApp)
      .put('/availability/1')
      .send({ date: '2026-05-20', shift_id: 1, status: 'available' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('available');
  });
});

// ─── Schedule ─────────────────────────────────────────────────────────────────

describe('GET /schedule', () => {
  it('returns 200 and an array', async () => {
    const res = await request(testApp).get('/schedule');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('PUT /schedule', () => {
  // Only employers can assign shifts
  it('returns 403 when x-role is not "employer"', async () => {
    const res = await request(testApp)
      .put('/schedule')
      .send({ employeeId: 1, date: '2026-05-20', shift_id: 1 });
    expect(res.status).toBe(403);
  });

  // shift_id is missing - Zod should reject this
  it('returns 400 when the body fails Zod validation', async () => {
    const res = await request(testApp)
      .put('/schedule')
      .set('x-role', 'employer')
      .send({ employeeId: 1, date: '2026-05-20' }); // shift_id missing
    expect(res.status).toBe(400);
  });

  // Shift instance exists in the database → assignment should succeed
  it('returns 200 when shift is assigned successfully', async () => {
    const instance = { id: 10, shift_id: 1, date: '2026-05-20' };
    mockPrisma.shiftInstances.findFirst.mockResolvedValue(instance); // pretend shift exists
    const res = await request(testApp)
      .put('/schedule')
      .set('x-role', 'employer')
      .send({ employeeId: 1, date: '2026-05-20', shift_id: 1 });
    expect(res.status).toBe(200);
    expect(res.body.employeeId).toBe(1);
  });
});

describe('DELETE /schedule', () => {
  // Only employers can remove assignments
  it('returns 403 when x-role is not "employer"', async () => {
    const res = await request(testApp)
      .delete('/schedule')
      .send({ employeeId: 1, date: '2026-05-20', shift_id: 1 });
    expect(res.status).toBe(403);
  });

  // Shift instance doesn't exist → nothing to delete, but still succeeds
  it('returns 204 when the shift instance does not exist (nothing to delete)', async () => {
    mockPrisma.shiftInstances.findFirst.mockResolvedValue(null); // shift not found
    const res = await request(testApp)
      .delete('/schedule')
      .set('x-role', 'employer')
      .send({ employeeId: 1, date: '2026-05-20', shift_id: 1 });
    expect(res.status).toBe(204);
  });

  // Shift instance exists → delete it and return 204
  it('returns 204 after successfully removing the assignment', async () => {
    mockPrisma.shiftInstances.findFirst.mockResolvedValue({ id: 10 }); // shift found
    const res = await request(testApp)
      .delete('/schedule')
      .set('x-role', 'employer')
      .send({ employeeId: 1, date: '2026-05-20', shift_id: 1 });
    expect(res.status).toBe(204);
  });
});

// ─── CORS headers ─────────────────────────────────────────────────────────────

// Browsers send an OPTIONS "preflight" request before a cross-origin request
// to check if the server allows it. We verify the backend responds correctly.
describe('CORS preflight', () => {
  it('OPTIONS preflight returns Access-Control-Allow-Origin matching the frontend URL', async () => {
    const frontendUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const res = await request(testApp)
      .options('/api/health')
      .set('Origin', frontendUrl)                        // simulate a browser on the frontend URL
      .set('Access-Control-Request-Method', 'GET');      // asking "can I do a GET?"
    // The backend must echo back the frontend URL in this header
    expect(res.headers['access-control-allow-origin']).toBe(frontendUrl);
  });
});

// ─── App bootstrap ────────────────────────────────────────────────────────────

// Verifies that createApp() itself works correctly when called fresh
// This is useful to catch any startup errors (missing config, crash on init, etc.)
describe('app bootstrap', () => {
  it('createApp() starts and serves a request without throwing', async () => {
    // Create a completely new app instance (not the shared testApp)
    const freshApp = createApp(mockPrisma, {
      bcrypt: mockBcrypt,
      requiresAuth: () => (_req, _res, next) => next()
    });
    const res = await request(freshApp).get('/api/health');
    expect(res.status).toBe(200); // app started fine and can handle requests
  });
});

