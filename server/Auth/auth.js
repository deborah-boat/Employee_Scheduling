const { auth } = require("express-openid-connect");
const dotenv = require("dotenv");
dotenv.config({ override: false });

const port = process.env.PORT || 3000;
const sessionSecret =
  process.env.AUTH0_SECRET ||
  process.env.SECRET;

if (!sessionSecret) {
  throw new Error("Missing AUTH0_SECRET (or SECRET) environment variable");
}

const config = {
  authRequired: false,
  auth0Logout: true,
  idpLogout: false,
  secret: sessionSecret,
  baseURL: process.env.AUTH0_BASE_URL || `http://localhost:${port}`,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuerBaseURL:
    process.env.AUTH0_ISSUER_BASE_URL ||
    (process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}` : undefined),
  routes: {
    login: false,
    callback: "/callback",
    logout: false,
  },
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile email',
  },
  errorOnRequiredAuth: true, // Returns 401 instead of redirecting on protected routes
};

const authMiddleware = auth(config);

module.exports = {
  authMiddleware
};