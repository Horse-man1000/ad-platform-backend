# ENVIRONMENT

## Core Variables

- PORT: Application port for Express server.
- NODE_ENV: Runtime environment (development/production/test).
- DATABASE_URL: Prisma/PostgreSQL connection string.
- CORS_ORIGINS: Comma-separated list of allowed frontend origins.

Example:

`CORS_ORIGINS=http://localhost:5173,http://localhost:3001`

## Notes

- Environment variables are loaded with dotenv in src/app.js.
- Keep secrets only in .env and do not commit sensitive values.
- .env.example should document required keys without real credentials.
