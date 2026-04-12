# Server

Backend workspace for the Employee project.

## Setup

1. Install dependencies:

	npm install

2. Create a local environment file from `.env.example`:

	copy .env.example .env

3. Start development server:

	npm run dev

The API runs on `http://localhost:4000` by default.

## Database (Prisma)

This server now uses Prisma with SQLite for login users.
Passwords are stored as bcrypt hashes (not plain text).

1. Run migrations and seed data:

	npm run prisma:migrate

2. Reseed manually if needed:

	npm run prisma:seed

## Endpoints

### Health

- Method: `GET`
- URL: `/api/health`

### Login

- Method: `POST`
- URL: `/api/login`
- Body:

  {
	 "email": "employee1@sundsgarden.se",
	 "password": "123456",
	 "role": "employee",
	 "rememberMe": true
  }

Demo users:

- employer: `employer1@sundsgarden.se` / `123456`
- employee: `employee1@sundsgarden.se` / `123456`
