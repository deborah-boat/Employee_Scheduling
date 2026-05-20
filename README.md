# Sundsgården — Employee Scheduling System

![license](https://img.shields.io/badge/license-MIT-black)
![status](https://img.shields.io/badge/status-in%20development-yellow)
![stack](https://img.shields.io/badge/stack-React%20%7C%20Node.js%20%7C%20PostgreSQL-blue)

*A full-stack web application for managing employee schedules, availability, and shift assignments in a restaurant environment.*

---

![App Preview](src/assets/appview.png)

---

## Table of Contents

- [Features](#features)
  - [Employer](#employer)
  - [Employee](#employee)
- [Technologies & Tools](#technologies--tools)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Database](#database)
- [Project Structure](#project-structure)
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

### Frontend

| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI component library |
| [Vite 8](https://vitejs.dev/) | Build tool and dev server |
| [ESLint](https://eslint.org/) | Code linting |

### Backend

| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) | Runtime environment |
| [Express 5](https://expressjs.com/) | HTTP server and routing |
| [TypeScript](https://www.typescriptlang.org/) | Static typing |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Password hashing |
| [Zod](https://zod.dev/) | Schema validation |
| [Winston](https://github.com/winstonjs/winston) | Server-side logging |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable management |

### Database

| Technology | Purpose |
|---|---|
| [PostgreSQL](https://www.postgresql.org/) | Relational database |
| [Prisma 6](https://www.prisma.io/) | ORM and database migrations |

---

## Project Structure

```
Employee_Scheduling/
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/   # UI components (EmployerView, EmployeeView, LoginScreen…)
│       ├── styles/       # Component-scoped CSS
│       └── assets/       # Images and static files
└── server/          # Node.js + Express backend
    ├── index.js          # Entry point
    ├── logger.js         # Winston logger setup
    └── prisma/
        ├── schema.prisma # Database schema
        └── seed.ts       # Database seeding script
```

---

## Authors

- **Backend Course Student** — Full-stack development
    - Deborah Boateng
    - Gláucia Silva Bierwagen
    - Jane Lehtola
