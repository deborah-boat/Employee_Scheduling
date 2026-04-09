# Employee Scheduling – Sundsgården

A full-stack employee scheduling system for the hotel **Sundsgården**. Managers can register employees, assign work shifts and view the weekly schedule. Employees can declare their availability.

---

## Project Structure

```
Employee_Scheduling/
├── client/          # React + Vite frontend
└── server/          # Node.js + Express + SQLite backend
```

---

## Getting Started

### 1. Backend (server)

```bash
cd server
cp .env.example .env   # edit JWT_SECRET with a strong secret
npm install
npm run seed           # populate initial data
npm run dev            # start with hot-reload (nodemon)
```

The API will be available at `http://localhost:3001`.

### 2. Frontend (client)

```bash
cd client
cp .env.example .env   # set VITE_API_URL if needed
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

### server/.env

| Variable     | Default                            | Description                    |
|--------------|------------------------------------|--------------------------------|
| `PORT`       | `3001`                             | Port the API listens on        |
| `JWT_SECRET` | *(required)*                       | Secret key for signing JWTs    |
| `DB_PATH`    | `./data/employee_scheduling.db`    | Path to the SQLite database    |

### client/.env

| Variable        | Default                         | Description              |
|-----------------|---------------------------------|--------------------------|
| `VITE_API_URL`  | `http://localhost:3001/api`     | Base URL of the REST API |

---

## API Endpoints

| Method   | Path                                    | Auth           | Description                               |
|----------|-----------------------------------------|----------------|-------------------------------------------|
| `POST`   | `/api/auth/login`                       | —              | Login; returns JWT token                  |
| `GET`    | `/api/employees`                        | Any            | List all employees                        |
| `GET`    | `/api/employees/:id`                    | Any            | Get employee by ID                        |
| `POST`   | `/api/employees`                        | Employer only  | Create employee + linked user account     |
| `PUT`    | `/api/employees/:id`                    | Employer only  | Update employee                           |
| `DELETE` | `/api/employees/:id`                    | Employer only  | Delete employee                           |
| `GET`    | `/api/schedule?week_start=YYYY-MM-DD`   | Any            | Get weekly schedule                       |
| `PUT`    | `/api/schedule/:day/:shift`             | Employer only  | Assign / unassign an employee to a shift  |
| `GET`    | `/api/availability/:employeeId`         | Any            | Get availability for an employee          |
| `PUT`    | `/api/availability/:employeeId/:day/:shift` | Any        | Update availability (employee: own only)  |

---

## Roles & Test Credentials

| Role       | Username                   | Password   |
|------------|----------------------------|------------|
| `employer` | `admin`                    | `admin123` |
| `employee` | `ellen@sundsgarden.se`     | `code1`    |
| `employee` | `oskar@sundsgarden.se`     | `code2`    |

> Run `npm run seed` in the `server/` folder to create these accounts.

---

## Tech Stack

- **Frontend:** React 19, Vite, plain CSS
- **Backend:** Node.js, Express 4, better-sqlite3, bcryptjs, jsonwebtoken
