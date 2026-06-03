# Sundsgården — Employee Scheduling System

![license](https://img.shields.io/badge/license-MIT-black)
![status](https://img.shields.io/badge/status-in%20development-yellow)
![stack](https://img.shields.io/badge/stack-React%20%7C%20Node.js%20%7C%20PostgreSQL-blue)

*A full-stack web application for managing employee schedules, availability, and shift assignments in a restaurant environment.*

---

![App Preview](client/src/assets/appview.png)

[Figma Prototype](https://www.figma.com/proto/5pFg4O1uXgn8UQ3TH8wLV8/Restarurant-Project_Design?node-id=33-10595&t=QxcmE2yvdcgN6Kno-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=20%3A2516&show-proto-sidebar=1)

---

## Table of Contents

- [Features](#features)
  - [Employer](#employer)
  - [Employee](#employee)
- [Technologies & Tools](#technologies--tools)
- [Project Structure](#project-structure)
- [Running the Project](#running-the-project)
  - [Docker (recommended)](#docker-recommended)
  - [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Authentication](#authentication)
- [Security Decisions](#security-decisions)
- [Authors](#authors)

---

## Features

### Employer

- **Employee Management** — View, add, and manage all registered employees.
- **Shift Scheduling** — Assign employees to morning, afternoon, and night shifts for each day of the week.
- **Work Schedule View** — Visual overview of the full weekly schedule by shift and day.
- **Job Schedule** — Manage shift definitions (name, start time, end time).

### Employee

- **Personal Schedule** — View assigned shifts for the current week.
- **Availability** — Submit and update availability preferences for each day and shift.
- **Profile View** — See personal information and role details.

---

## Technologies & Tools

| Category | Technology | Purpose |
|---|---|---|
| Frontend | [React 19](https://react.dev/) | UI component library |
| Frontend | [Vite 8](https://vitejs.dev/) | Build tool and dev server |
| Frontend | [ESLint](https://eslint.org/) | Code linting |
| Frontend | [Vitest](https://vitest.dev/) | Unit and component testing |
| Frontend | [Testing Library](https://testing-library.com/) | React component testing utilities |
| Backend | [Node.js](https://nodejs.org/) | Runtime environment |
| Backend | [Express 5](https://expressjs.com/) | HTTP server and routing |
| Backend | [express-openid-connect](https://github.com/auth0/express-openid-connect) | Auth0 OIDC authentication middleware |
| Backend | [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Password hashing |
| Backend | [Zod](https://zod.dev/) | Schema validation |
| Backend | [Winston](https://github.com/winstonjs/winston) | Structured server-side logging |
| Backend | [dotenv](https://github.com/motdotla/dotenv) | Environment variable management |
| Backend | [Vitest](https://vitest.dev/) | Unit and integration testing |
| Database | [PostgreSQL](https://www.postgresql.org/) | Relational database |
| Database | [Prisma 6](https://www.prisma.io/) | ORM and schema migrations |
| Infrastructure | [Docker](https://www.docker.com/) | Containerisation |
| Infrastructure | [Docker Compose](https://docs.docker.com/compose/) | Multi-service orchestration |
| Infrastructure | [Nginx](https://nginx.org/) | Serves the built frontend in production |

---

## Project Structure

```
Employee_Scheduling/
├── docker-compose.yml        # Orchestrates postgres, backend, and frontend
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/       # UI components (EmployerView, EmployeeView, LoginScreen…)
│   │   ├── styles/           # Component-scoped CSS
│   │   ├── utils/            # Helpers (authStorage)
│   │   └── assets/           # Images and static files
│   ├── .dockerignore         # Excludes node_modules and .env from the image
│   └── Dockerfile            # Nginx-based production image
└── server/                   # Node.js + Express backend
    ├── index.js              # Entry point
    ├── app.js                # Express app factory (injectable deps for testing)
    ├── logger.js             # Winston logger setup
    ├── Auth/
    │   └── auth.js           # Auth0 OIDC configuration
    ├── routes/               # auth, employees, availability, schedule
    ├── prisma/
    │   ├── schema.prisma     # Database schema
    │   └── seed.ts           # Database seeding script
    └── docker/
        ├── backend.Dockerfile
        └── frontend.Dockerfile
```

---

## Running the Project

### Docker (recommended)

| Step | Action | Command |
|---|---|---|
| 1 | Copy `.env.example` to `server/.env` and fill in your Auth0 credentials (see [Environment Variables](#environment-variables)) | — |
| 2 | Start all services from the project root.<br>**Frontend:** http://localhost:5173<br>**Backend API:** http://localhost:4000<br>**PostgreSQL:** localhost:5433 | `docker compose up --build` |
| 3 | Stop and remove volumes | `docker compose down -v` |

### Local Development

Requires Node.js and a running PostgreSQL instance.

| Service | Directory | Commands |
|---|---|---|
| Backend | `server/` | `npm install`<br>`npx prisma db push`<br>`npm run dev` — nodemon on port 4000 |
| Frontend | `client/` | `npm install`<br>`npm run dev` — Vite dev server on port 5173 |

---

## Testing

Both the backend and frontend use [Vitest](https://vitest.dev/) as the test runner.

### How to Run the Tests

| Part | Test types | Command |
|------|------------|---------|
| **Backend** | Unit + Integration | `cd server` then `npm test` |
| **Frontend** | Unit | `cd client` then `npm test` |

The backend uses a fake Prisma client and mock bcrypt — no real database or Auth0 credentials are needed to run the tests.

<details>
<summary><strong>Backend — Unit Tests</strong> &nbsp;·&nbsp; <code>server/tests/unit/employees.test.js</code> &nbsp;·&nbsp; 25 tests</summary>

<br>

Pure helper functions tested in isolation — no database, no network, no Express.

| Function | What it checks |
|----------|----------------|
| `normalizeEmail` | Lowercases an email that has uppercase letters |
| `normalizeEmail` | Strips leading and trailing whitespace |
| `isValidRole` | Accepts `"employee"` |
| `isValidRole` | Accepts `"employer"` |
| `isValidRole` | Accepts mixed case (normalizes before checking) |
| `isValidRole` | Rejects an arbitrary string |
| `isValidRole` | Rejects an empty string |
| `parseId` | Parses a valid numeric string to an integer |
| `parseId` | Returns `NaN` for a non-numeric string |
| `parseId` | Returns `NaN` for an empty string |
| `filterEmployeesByName` | Returns all employees when no name filter is provided |
| `filterEmployeesByName` | Finds an employee by partial name (case-insensitive) |
| `filterEmployeesByName` | Returns multiple employees when the search term matches several |
| `filterEmployeesByName` | Returns an empty array when no employee matches |
| `validateEmployeeInput` | Returns `ok:true` for valid name and email |
| `validateEmployeeInput` | Returns `ok:false` when name is empty |
| `validateEmployeeInput` | Returns `ok:false` when name is whitespace only |
| `validateEmployeeInput` | Returns `ok:false` when email has no `@` symbol |
| `validateEmployeeInput` | Returns `ok:false` when email is missing |
| `validateAvailabilityInput` | Returns `ok:true` for a valid availability record |
| `validateAvailabilityInput` | Accepts `shift_id` as a numeric string (coerces it) |
| `validateAvailabilityInput` | Returns `ok:false` when date is missing |
| `validateAvailabilityInput` | Returns `ok:false` when `shift_id` is zero |
| `validateAvailabilityInput` | Returns `ok:false` when `shift_id` is not a number |
| `validateAvailabilityInput` | Returns `ok:false` when status is empty |

![Backend unit tests passing](client/src/assets/testserver.png)

</details>

<details>
<summary><strong>Backend — Integration Tests</strong> &nbsp;·&nbsp; <code>server/tests/integration/api.test.js</code> &nbsp;·&nbsp; 27 tests</summary>

<br>

Real HTTP requests sent to the Express app via [supertest](https://github.com/ladjs/supertest).

| Endpoint | Scenario | Expected result |
|----------|----------|-----------------|
| `GET /api/health` | Server is running | `200` + `{ status: "ok" }` |
| `POST /api/login` | Missing required fields | `400` Bad Request |
| `POST /api/login` | Role is not `"employee"` or `"employer"` | `400` Bad Request |
| `POST /api/login` | User does not exist in the database | `401` Unauthorized |
| `POST /api/login` | Password is wrong | `401` Unauthorized |
| `POST /api/login` | Valid credentials | `200` + user info |
| `GET /employees` | No auth required | `200` + array of employees |
| `POST /employees` | `x-role` header is not `"employer"` | `403` Forbidden |
| `POST /employees` | Body fails validation (missing email) | `400` Bad Request |
| `POST /employees` | Valid input with employer role | `201` Created |
| `DELETE /employees/:id` | `x-role` is not `"employer"` | `403` Forbidden |
| `DELETE /employees/:id` | ID is not a valid number | `400` Bad Request |
| `DELETE /employees/:id` | Valid employer + valid ID | `204` No Content |
| `GET /availability/:id` | ID is not a valid number | `400` Bad Request |
| `GET /availability/:id` | Valid employee ID | `200` + availability array |
| `PUT /availability/:id` | ID is not a valid number | `400` Bad Request |
| `PUT /availability/:id` | Body fails Zod validation (missing `shift_id`) | `400` Bad Request |
| `PUT /availability/:id` | No existing record — creates new | `200` + created record |
| `GET /schedule` | No auth required | `200` + array |
| `PUT /schedule` | `x-role` is not `"employer"` | `403` Forbidden |
| `PUT /schedule` | Body fails Zod validation (missing `shift_id`) | `400` Bad Request |
| `PUT /schedule` | Valid shift assignment | `200` + assignment |
| `DELETE /schedule` | `x-role` is not `"employer"` | `403` Forbidden |
| `DELETE /schedule` | Shift instance does not exist | `204` No Content |
| `DELETE /schedule` | Shift instance exists | `204` No Content |
| CORS preflight | `OPTIONS` request from frontend origin | `Access-Control-Allow-Origin` matches |
| App bootstrap | `createApp()` starts without throwing | `200` on health check |

![Frontend unit tests passing](client/src/assets/testclient.png)

</details>

<details>
<summary><strong>Frontend — Unit Tests</strong> &nbsp;·&nbsp; <code>client/tests/unit/components.test.jsx</code> &nbsp;·&nbsp; 17 tests</summary>

<br>

Fake component wrappers tested in isolation using [Testing Library](https://testing-library.com/) with `jsdom`.

| Component | What it checks |
|-----------|----------------|
| `LoginScreen` | Shows the employer subtitle when role is `"employer"` |
| `LoginScreen` | Shows the employee subtitle when role is `"employee"` |
| `LoginScreen` | Shows a validation error when submitted with empty fields |
| `EmployeeList` | Shows "No employees found." when the list is empty |
| `EmployeeList` | Renders each employee name and position |
| `EmployeeList` | Shows the placeholder emoji when an employee has no profile picture |
| `EmployeeList` | Shows the profile image when an employee has a picture |
| `EmployerView` | Shows the Employees tab content by default |
| `EmployerView` | Renders all four navigation tabs |
| `EmployerView` | Switches to the Register employee tab when clicked |
| `RegisterEmployeeForm` | Renders first name, last name, and email fields |
| `RegisterEmployeeForm` | Does not submit when required name fields are empty |
| `RegisterEmployeeForm` | Calls `onSubmit` and shows confirmation when fields are filled |
| `App` (auth guard) | Shows the role-selection screen when no role is set |
| `App` (auth guard) | Shows the employer dashboard when role is `"employer"` |
| `App` (auth guard) | Shows the employee dashboard when role is `"employee"` |
| `App` (auth guard) | Hides the employer dashboard when no role is set |

</details>

<details>
<summary><strong>GitHub actions</strong> </summary>

<br>

![Github Actions](client/src/assets/githubactions.png)

</details>

---


## Authentication

Authentication is handled by **Auth0** using the `express-openid-connect` library. When a user clicks "Continue with Auth0", they are redirected to the Auth0 login page. After logging in, Auth0 redirects back to the app and a session cookie is created automatically. Protected routes use the `requiresAuth()` middleware to check if the user is logged in — if not, the request is rejected with `401 Unauthorized`. The user's profile is read from `req.oidc.user` and returned to the frontend so it can show the right dashboard.

## Security Decisions

- **Secrets are stored in `.env`** and never committed to Git or baked into Docker images, to prevent unauthorized access.
- **Protected routes return `401`** when the session is missing or expired, and **`403`** when a non-employer tries to access employer-only actions.
- **CORS only allows requests from the frontend origin** to block other domains from calling the API.
- **Session state is kept in a cookie, not `localStorage`**, because `localStorage` can be read by JavaScript and is vulnerable to XSS attacks.
- **The session cookie is configured with `sameSite` and `secure` flags** to reduce the risk of CSRF attacks.
- **Passwords are hashed with `bcrypt`** so plain-text passwords are never stored in the database.
- **All request bodies are validated with Zod** before touching the database, so invalid input is rejected early.

---

## Reflections

**Docker** removed the "works on my machine" problem by running the backend, frontend, and database in containers that behave the same everywhere. It taught us how multi-service applications are structured in practice.

**Testing** was more useful than expected. Unit tests caught edge cases early, integration tests verified real HTTP behaviour, and GitHub Actions ran everything automatically on every push.

**Deployment** showed us that a working local setup is only half the job — Auth0 callback URLs, environment variables, and cookie flags only surface as problems in a real deployed environment.

**Database and ORM** — Prisma made schema changes trackable through migrations and the seed script kept test data consistent across machines. Getting migrations to run at the right moment inside Docker took some trial and error.

**Authentication with Auth0** was the most complex part. Understanding the OAuth 2.0 flow — the redirect, the callback, and the session cookie — was challenging at first, but it showed us the value of delegating security-critical work to a dedicated service.

---

## Authors

- **Backend Course Student** — Full-stack development
    - Deborah Boateng
    - Gláucia Silva Bierwagen
    - Jane Lehtola
