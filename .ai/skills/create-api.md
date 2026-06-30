# Purpose

Guide creation of API-facing integration points for DBLink in consumer applications.

# When to use

- A consumer service needs to expose DBLink-backed endpoints.
- You need to document API integration patterns around this library.

# Prerequisites

- Understand `Context` + `TableSet` usage.
- API framework exists in consumer repo.

# Inputs

- Entity definitions
- Required query/filter behavior
- API contract from consumer app

# Outputs

- API integration design notes
- Query composition mapped to endpoint needs

# Files normally modified

Not found in current codebase.

API layer files are expected in consumer repositories.

# Implementation Steps

1. Confirm API framework location in consumer code.
2. Map endpoint parameters to DBLink query operations (`where`, `orderBy`, `limit`).
3. Translate include/join requirements to DBLink fluent calls.
4. Add transaction boundaries for multi-write operations.
5. Add integration tests around endpoint + DB behavior.

# Validation

- Endpoint returns expected data for filters and pagination.
- Query behavior matches direct DBLink usage tests.

# Common mistakes

- Implementing API controllers inside this library repo.
- Skipping transaction handling for multi-step writes.

# Related skills

- `create-service`
- `create-repository`
- `create-test`

# Example from repository

Not found in current codebase.

Closest reference: query composition in `test/workflow.test.ts` and `test/Integration.test.ts`.
