// This file runs before every test file on the server side.
// It sets the DATABASE_URL env var so app.js can be imported without crashing
// (index.js checks for it at startup, but tests import app.js directly).
process.env.DATABASE_URL = 'mock://test';
process.env.NODE_ENV = 'test';
