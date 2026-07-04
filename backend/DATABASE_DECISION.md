# Database architecture decision

## Stabilization decision

KAVACH uses MongoDB through Mongoose as its single backend database
architecture.

This decision preserves the active implementation:

- `src/config/db.js` establishes the MongoDB connection.
- `src/models/user.js` and `src/models/machine.js` define Mongoose models.
- Controllers and the sensor simulator use Mongoose queries.
- The existing `MONGO_URI` deployment contract remains valid.

The unused Prisma/PostgreSQL dependencies and schema were removed because no
runtime code used them and the schema was incompatible with the installed
Prisma version.

## Near-term rules

- New backend persistence code must use the Mongoose models or a repository
  abstraction backed by Mongoose.
- Database credentials must be supplied through environment configuration and
  must never be committed or logged.
- Seed operations must be run deliberately; the current machine seed replaces
  existing machine records.
- Production schema changes must be documented and deployed through an
  explicit migration script before they are used by application code.

## Future migration plan

If historical telemetry volume, relational work-order workflows, or reporting
requirements justify PostgreSQL/TimescaleDB later:

1. Introduce repository interfaces around assets, users, alerts, and telemetry.
2. Define and review a canonical relational schema and stable asset IDs.
3. Add versioned database migrations and a separate migration utility.
4. Backfill data from MongoDB while preserving Mongo `_id` and `machineId`
   mappings.
5. Run dual-read reconciliation and verify record counts and checksums.
6. Switch reads, then writes, behind a feature flag with a tested rollback.
7. Retire MongoDB only after backup, restore, and rollback acceptance tests.

No database migration is required for the current stabilization milestone.
