# AGENTS

## Project overview

DBLink is a TypeScript ORM library that provides decorator-driven entity mapping and fluent query APIs over a pluggable database handler abstraction.

## Architecture

- Metadata layer: decorators + reflect metadata
- Query layer: expression builders + query sets
- Execution layer: context/connection + adapter handler

## Folder structure

- `src/`: core library implementation
- `test/`: unit-like and integration tests
- `docs/`: additional documentation
- `.ai/`: AI knowledge system

## Technology stack

- TypeScript, Node.js ESM
- dblink-core SQL/handler primitives
- class-transformer, reflect-metadata
- Vitest, ESLint, Prettier

## Coding principles

- Prefer small, typed, focused modules.
- Keep ORM core backend-framework agnostic.
- Preserve API compatibility unless explicitly changing it.

## Design principles

- Fluent API for query composition
- Adapter-based database execution
- Metadata as mapping source of truth

## Business rules

This repo contains sample domain entities for tests only.

Application business rules: Not found in current codebase.

## Naming conventions

- Entity properties in camelCase
- DB columns often snake_case via `@Column('...')`
- Table names explicit via `@Table('...')`

## API conventions

- Query terminals: `list`, `single`, `count`, `stream`
- Query builders: `where`, `groupBy`, `orderBy`, `limit`, `select`, `include`, `join`

## Database conventions

- Primary keys declared with `@Id`
- Field/column map generated from metadata
- Transactions via `initTransaction`, `commit`, `rollback`

## Error handling

- Throws explicit errors for invalid state (`Transaction Not Started`, `Invalid Join`, missing metadata)

## Logging

- `Context` supports custom logger with `log(...args)`

## Transactions

- Transaction context is cloned from parent context and bound to dedicated connection

## Security

- Values in expression builders are parameterized
- Auth/authz concerns are outside library scope

## Testing

- Vitest suite includes integration tests requiring PostgreSQL
- Environment variables drive DB connection settings in tests

## Performance

- Use `select` to reduce payloads
- Use `limit` for pagination
- Use `stream` for large result sets

## Documentation

- README documents usage and API
- `.ai/` contains AI-operating documentation

## Do NOT

- Do not add framework-specific controller/service code to core ORM modules.
- Do not edit generated JS without corresponding TS source updates.
- Do not change decorator metadata keys without full impact review.

## Always

- Always add or update tests for behavior changes.
- Always run build and relevant tests before finalizing changes.
- Always preserve ESM import conventions in TS files.

## Repository navigation guide

Start points:
1. `src/index.ts`
2. `src/Context.ts`
3. `src/collection/TableSet.ts`
4. `src/collection/QuerySet.ts`
5. `test/workflow.test.ts`

## Useful commands

- `npm run build`
- `npm test`
- `npx vitest run test/Context.test.ts`
- `npx vitest run test/QueryBuilding.test.ts`

## Development workflow

1. Reproduce or define target behavior.
2. Write/adjust tests.
3. Implement minimal change in TS source.
4. Build and test.
5. Update docs when behavior changes.

## Review workflow

1. Inspect API/export changes.
2. Validate query/transaction correctness.
3. Validate metadata behavior.
4. Ensure tests cover modified logic.

## Common pitfalls

- Running integration tests without PostgreSQL.
- Assuming this repo includes deployment/auth/API server layers.
- Treating fixture models as production business contracts.
