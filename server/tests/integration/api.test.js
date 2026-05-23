// These are integration tests — they send real HTTP requests through the Express
// router and check that routes, middleware, and responses all work end-to-end.
// Prisma and bcrypt are injected as mocks so no real database is needed.
// No vi.mock() is used here — all dependencies are passed via createApp(prisma, deps).

import { describe, it, expect, vi, beforeEach } from 'vitest';

// supertest sends HTTP requests directly to the Express app — no real server needed
import request from 'supertest';

// createApp(prisma, deps) builds the app with whatever prisma / bcrypt we pass
import { createApp } from '../../app.js';

// ─── Mock dependencies ────────────────────────────────────────────────────────

const mockBcrypt = { compare: vi.fn() };

const mockPrisma = {
  user: {
    findFirst: vi.fn()
  },
  employee: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    delete: vi.fn()
  },
  availability: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
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

// Build the app once — all tests share this instance
// requiresAuth is bypassed with a no-op so tests run without a real OIDC session
const testApp = createApp(mockPrisma, {
  bcrypt: mockBcrypt,
  requiresAuth: () => (_req, _res, next) => next()
});

// Reset all stubs before each test so return values don't bleed across tests
beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.employee.findMany.mockResolvedValue([]);
  mockPrisma.employee.findFirst.mockResolvedValue(null);
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

describe('GET /api/health', () => {
  it('returns 200 and { status: "ok" }', async () => {
    const res = await request(testApp).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe('POST /api/login', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(testApp).post('/api/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('returns 400 when role is not "employee" or "employer"', async () => {
    const res = await request(testApp)
      .post('/api/login')
      .send({ email: 'a@b.com', password: 'secret', role: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/role/i);
  });

  it('returns 401 when the user does not exist in the database', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    const res = await request(testApp)
      .post('/api/login')
      .send({ email: 'ghost@example.com', password: 'secret', role: 'employee' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('returns 401 when the password is wrong', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 1, email: 'ellen@example.com', role: 'employee',
      password: '$hashed', displayName: 'Ellen'
    });
    mockBcrypt.compare.mockResolvedValue(false);
    const res = await request(testApp)
      .post('/api/login')
      .send({ email: 'ellen@example.com', password: 'wrong', role: 'employee' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('returns 200 with user info on successful login', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 1, email: 'ellen@example.com', role: 'employee',
      password: '$hashed', displayName: 'Ellen Johansson'
    });
    mockBcrypt.compare.mockResolvedValue(true);
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
    mockPrisma.employee.findMany.mockResolvedValue([
      { id: 1, name: 'Ellen Johansson', email: 'ellen@example.com', shifts: [] }
    ]);
    const res = await request(testApp).get('/employees');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe('Ellen Johansson');
  });
});

describe('POST /employees', () => {
  it('returns 403 when x-role header is not "employer"', async () => {
    const res = await request(testApp)
      .post('/employees')
      .send({ name: 'New Worker', email: 'new@example.com' });
    expect(res.status).toBe(403);
  });

  it('returns 400 when the request body fails validation', async () => {
    const res = await request(testApp)
      .post('/employees')
      .set('x-role', 'employer')
      .send({ name: 'No Email' });
    expect(res.status).toBe(400);
  });

  it('returns 201 with the created employee when input is valid', async () => {
    const created = { id: 6, name: 'Sara Berg', email: 'sara@example.com' };
    mockPrisma.employee.create.mockResolvedValue(created);
    const res = await request(testApp)
      .post('/employees')
      .set('x-role', 'employer')
      .send({ name: 'Sara Berg', email: 'sara@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Sara Berg');
  });
});

describe('DELETE /employees/:id', () => {
  it('returns 403 when x-role is not "employer"', async () => {
    const res = await request(testApp).delete('/employees/1');
    expect(res.status).toBe(403);
  });

  it('returns 400 when the id is not a valid number', async () => {
    const res = await request(testApp)
      .delete('/employees/abc')
      .set('x-role', 'employer');
    expect(res.status).toBe(400);
  });

  it('returns 204 when the employee is deleted successfully', async () => {
    const res = await request(testApp)
      .delete('/employees/1')
      .set('x-role', 'employer');
    expect(res.status).toBe(204);
  });
});

// ─── Availability ─────────────────────────────────────────────────────────────

describe('GET /availability/:id', () => {
  it('returns 400 when the id is not a valid number', async () => {
    const res = await request(testApp).get('/availability/abc');
    expect(res.status).toBe(400);
  });

  it('returns 200 and the availability array for a valid employee id', async () => {
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

  it('returns 400 when the body fails Zod validation', async () => {
    const res = await request(testApp)
      .put('/availability/1')
      .send({ date: '2026-05-20', status: 'available' });
    expect(res.status).toBe(400);
  });

  it('returns 200 and creates a new availability record when none exists', async () => {
    const record = { id: 1, employeeId: 1, shift_id: 1, date: '2026-05-20', status: 'available' };
    mockPrisma.availability.findFirst.mockResolvedValue(null);
    mockPrisma.availability.create.mockResolvedValue(record);
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
  it('returns 403 when x-role is not "employer"', async () => {
    const res = await request(testApp)
      .put('/schedule')
      .send({ employeeId: 1, date: '2026-05-20', shift_id: 1 });
    expect(res.status).toBe(403);
  });

  it('returns 400 when the body fails Zod validation', async () => {
    const res = await request(testApp)
      .put('/schedule')
      .set('x-role', 'employer')
      .send({ employeeId: 1, date: '2026-05-20' });
    expect(res.status).toBe(400);
  });

  it('returns 200 when shift is assigned successfully', async () => {
    const instance = { id: 10, shift_id: 1, date: '2026-05-20' };
    mockPrisma.shiftInstances.findFirst.mockResolvedValue(instance);
    const res = await request(testApp)
      .put('/schedule')
      .set('x-role', 'employer')
      .send({ employeeId: 1, date: '2026-05-20', shift_id: 1 });
    expect(res.status).toBe(200);
    expect(res.body.employeeId).toBe(1);
  });
});

describe('DELETE /schedule', () => {
  it('returns 403 when x-role is not "employer"', async () => {
    const res = await request(testApp)
      .delete('/schedule')
      .send({ employeeId: 1, date: '2026-05-20', shift_id: 1 });
    expect(res.status).toBe(403);
  });

  it('returns 204 when the shift instance does not exist (nothing to delete)', async () => {
    mockPrisma.shiftInstances.findFirst.mockResolvedValue(null);
    const res = await request(testApp)
      .delete('/schedule')
      .set('x-role', 'employer')
      .send({ employeeId: 1, date: '2026-05-20', shift_id: 1 });
    expect(res.status).toBe(204);
  });

  it('returns 204 after successfully removing the assignment', async () => {
    mockPrisma.shiftInstances.findFirst.mockResolvedValue({ id: 10 });
    const res = await request(testApp)
      .delete('/schedule')
      .set('x-role', 'employer')
      .send({ employeeId: 1, date: '2026-05-20', shift_id: 1 });
    expect(res.status).toBe(204);
  });
});

