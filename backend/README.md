# BloodConnect Backend

Express + PostgreSQL + PostGIS REST API for the BloodConnect donor-coordination
platform.

## Requirements
- Node.js 18+
- PostgreSQL 12+ with the **PostGIS** extension enabled

## Setup
```bash
cp .env.example .env   # then edit DATABASE_URL with your PostgreSQL password
npm install
npm run migrate        # creates tables + PostGIS indexes
npm run seed           # optional: creates an ADMIN account (admin@bloodconnect.test / Admin@123)
npm run dev            # start with nodemon on http://localhost:5000
```

## Scripts
| Script | Purpose |
| --- | --- |
| `npm run dev` | Run with nodemon |
| `npm start` | Run with node |
| `npm run migrate` | Apply SQL migrations |
| `npm run seed` | Seed an admin user |
| `npm test` | Run the Jest integration test suite (requires PostgreSQL) |

## Test suite
Tests run against a dedicated `bloodconnect_test` database that is created and
migrated automatically. They cover authentication, donor profiles, blood request
creation, authorization, duplicate donor responses, invalid state transitions,
invalid blood groups and invalid coordinates.

```bash
npm test
```