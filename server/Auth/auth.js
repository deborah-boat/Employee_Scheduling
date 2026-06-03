// express-openid-connect is the Auth0 library that handles the login flow for us
const { auth } = require("express-openid-connect");
// dotenv loads the variables from our .env file into process.env
const dotenv = require("dotenv");
dotenv.config({ override: false });

// The port the backend runs on — defaults to 4000 if not set
const port = process.env.PORT || 4000;

// The session secret is used to encrypt the session cookie — it must stay private
const sessionSecret =
  process.env.AUTH0_SECRET ||
  process.env.SECRET;

// If the secret is missing the app should not start — it would be insecure
if (!sessionSecret) {
  throw new Error("Missing AUTH0_SECRET (or SECRET) environment variable");
}

// In production AUTH0_BASE_URL is our Render URL, in development it is localhost
const resolvedBaseURL = process.env.AUTH0_BASE_URL || `http://localhost:${port}`;

// We use this to know if we are running over HTTPS so we can set the right cookie flags
const isSecure = resolvedBaseURL.startsWith('https://');

const config = {
  // We handle our own login route so Auth0 does not redirect automatically
  authRequired: false,
  // Lets Auth0 handle the logout redirect
  auth0Logout: true,
  idpLogout: false,
  secret: sessionSecret,
  // The URL of our own app — Auth0 uses this to build the callback URL
  baseURL: resolvedBaseURL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  // The URL of the Auth0 tenant — where users are redirected to log in
  issuerBaseURL:
    process.env.AUTH0_ISSUER_BASE_URL ||
    (process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}` : undefined),
  routes: {
    // We define our own /api/auth/login route instead of using the default
    login: false,
    // Auth0 redirects back to /callback after a successful login
    callback: "/callback",
    logout: false,
  },
  authorizationParams: {
    // "code" means we use the Authorization Code Flow — the most secure option
    response_type: 'code',
    // We request the user identity, profile, and email from Auth0
    scope: 'openid profile email',
  },
  // Return 401 instead of redirecting when a protected route is hit without a session
  errorOnRequiredAuth: true,
  session: {
    cookie: {
      // In production (HTTPS) we need sameSite: None so the cookie works cross-origin
      // In development (HTTP) we use Lax which is safer for same-site requests
      sameSite: isSecure ? 'None' : 'Lax',
      // secure: true means the cookie is only sent over HTTPS
      secure: isSecure,
    }
  },
};

// Build the middleware using our config — this is what we attach to the Express app
const authMiddleware = auth(config);

module.exports = {
  authMiddleware
};
