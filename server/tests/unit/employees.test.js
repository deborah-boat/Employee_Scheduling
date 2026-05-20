// Importing the test tools from vitest
import { describe, it, expect } from 'vitest';

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────
// These are pure helper functions that mirror the business logic in index.js.
// They are tested in isolation — no database, no network, no Express.

// Normalizes an email address: trims whitespace and converts to lowercase.
// Mirrors: const normalizedEmail = String(email).trim().toLowerCase()
function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

// Validates that a role string is exactly "employee" or "employer".
// Mirrors the role guard in POST /api/login
function isValidRole(role) {
  const normalized = String(role).toLowerCase();
  return normalized === 'employee' || normalized === 'employer';
}

// Parses a URL-parameter string to an integer ID.
// Returns NaN when the string is not a valid number.
// Mirrors: const id = parseInt(req.params.id); if (isNaN(id)) ...
function parseId(str) {
  return parseInt(str, 10);
}

// Filters an employee list by name — case-insensitive, partial match.
// Mirrors the WHERE name contains clause in GET /employees?name=...
function filterEmployeesByName(employees, name) {
  if (!name) return employees;
  const lower = name.toLowerCase();
  return employees.filter((e) => e.name.toLowerCase().includes(lower));
}

// Validates new-employee input before it reaches the database.
// name must be a non-empty string; email must contain @ and a domain.
// Mirrors the Zod employeeSchema used in POST /employees
function validateEmployeeInput({ name, email }) {
  if (!name || String(name).trim().length === 0) return { ok: false, field: 'name' };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, field: 'email' };
  return { ok: true };
}

// Validates availability input before an upsert.
// shift_id must coerce to a positive integer; date and status must be present.
// Mirrors the Zod availabilitySchema used in PUT /availability/:id
function validateAvailabilityInput({ date, shift_id, status }) {
  if (!date) return { ok: false, field: 'date' };
  const id = Number(shift_id);
  if (!Number.isInteger(id) || id < 1) return { ok: false, field: 'shift_id' };
  if (typeof status !== 'string' || status.trim().length === 0) return { ok: false, field: 'status' };
  return { ok: true };
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

// Tests for normalizeEmail
describe('normalizeEmail', () => {
  it('lowercases an email that has uppercase letters', () => {
    expect(normalizeEmail('Alice@Example.COM')).toBe('alice@example.com');
  });

  it('strips leading and trailing whitespace', () => {
    expect(normalizeEmail('  bob@example.com  ')).toBe('bob@example.com');
  });
});

// Tests for isValidRole
describe('isValidRole', () => {
  it('accepts "employee"', () => {
    expect(isValidRole('employee')).toBe(true);
  });

  it('accepts "employer"', () => {
    expect(isValidRole('employer')).toBe(true);
  });

  it('accepts mixed case (normalizes before checking)', () => {
    expect(isValidRole('Employer')).toBe(true);
  });

  it('rejects an arbitrary string', () => {
    expect(isValidRole('admin')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidRole('')).toBe(false);
  });
});

// Tests for parseId
describe('parseId', () => {
  it('parses a valid numeric string to an integer', () => {
    expect(parseId('5')).toBe(5);
  });

  it('returns NaN for a non-numeric string', () => {
    expect(parseId('abc')).toBeNaN();
  });

  it('returns NaN for an empty string', () => {
    expect(parseId('')).toBeNaN();
  });
});

// Tests for filterEmployeesByName
describe('filterEmployeesByName', () => {
  const employees = [
    { id: 1, name: 'Ellen Johansson' },
    { id: 2, name: 'Oskar Nilsson' },
    { id: 3, name: 'Maria Ramos' },
  ];

  it('returns all employees when no name filter is provided', () => {
    expect(filterEmployeesByName(employees, '')).toHaveLength(3);
  });

  it('finds an employee by partial name (case-insensitive)', () => {
    const result = filterEmployeesByName(employees, 'oskar');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Oskar Nilsson');
  });

  it('returns multiple employees when the search term matches several', () => {
    // "n" appears in "Ellen", "Nilsson", and "Ramos" — only "Ellen" and "Nilsson" contain "son"
    const result = filterEmployeesByName(employees, 'son');
    expect(result).toHaveLength(2);
  });

  it('returns an empty array when no employee matches', () => {
    expect(filterEmployeesByName(employees, 'xyz')).toHaveLength(0);
  });
});

// Tests for validateEmployeeInput
describe('validateEmployeeInput', () => {
  it('returns ok:true for valid name and email', () => {
    expect(validateEmployeeInput({ name: 'Sara Berg', email: 'sara@example.com' })).toEqual({ ok: true });
  });

  it('returns ok:false when name is empty', () => {
    const result = validateEmployeeInput({ name: '', email: 'sara@example.com' });
    expect(result.ok).toBe(false);
    expect(result.field).toBe('name');
  });

  it('returns ok:false when name is whitespace only', () => {
    const result = validateEmployeeInput({ name: '   ', email: 'sara@example.com' });
    expect(result.ok).toBe(false);
    expect(result.field).toBe('name');
  });

  it('returns ok:false when email has no @ symbol', () => {
    const result = validateEmployeeInput({ name: 'Sara', email: 'notanemail' });
    expect(result.ok).toBe(false);
    expect(result.field).toBe('email');
  });

  it('returns ok:false when email is missing', () => {
    const result = validateEmployeeInput({ name: 'Sara', email: '' });
    expect(result.ok).toBe(false);
    expect(result.field).toBe('email');
  });
});

// Tests for validateAvailabilityInput
describe('validateAvailabilityInput', () => {
  it('returns ok:true for a valid availability record', () => {
    const result = validateAvailabilityInput({ date: '2026-05-20', shift_id: 1, status: 'available' });
    expect(result).toEqual({ ok: true });
  });

  it('accepts shift_id as a numeric string (coerces it)', () => {
    const result = validateAvailabilityInput({ date: '2026-05-20', shift_id: '2', status: 'unavailable' });
    expect(result).toEqual({ ok: true });
  });

  it('returns ok:false when date is missing', () => {
    const result = validateAvailabilityInput({ date: '', shift_id: 1, status: 'available' });
    expect(result.ok).toBe(false);
    expect(result.field).toBe('date');
  });

  it('returns ok:false when shift_id is zero', () => {
    const result = validateAvailabilityInput({ date: '2026-05-20', shift_id: 0, status: 'available' });
    expect(result.ok).toBe(false);
    expect(result.field).toBe('shift_id');
  });

  it('returns ok:false when shift_id is not a number', () => {
    const result = validateAvailabilityInput({ date: '2026-05-20', shift_id: 'abc', status: 'available' });
    expect(result.ok).toBe(false);
    expect(result.field).toBe('shift_id');
  });

  it('returns ok:false when status is empty', () => {
    const result = validateAvailabilityInput({ date: '2026-05-20', shift_id: 1, status: '' });
    expect(result.ok).toBe(false);
    expect(result.field).toBe('status');
  });
});
