
// This file runs automatically before every test file.
// It loads extra matchers from jest-dom so I can use things like
// .toBeInTheDocument() inside my expect() calls.
// Without this import, those matchers wouldn't exist and the tests would crash.
import '@testing-library/jest-dom';
