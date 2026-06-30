# Purpose

Guide creation of asynchronous jobs in consumer systems using DBLink.

# When to use

- Background processing needs database reads/writes.

# Prerequisites

- Job runtime exists in consumer app.

# Inputs

- Job payload
- Idempotency and retry requirements

# Outputs

- Job handler design using DBLink safely

# Files normally modified

Not found in current codebase.

# Implementation Steps

1. Define idempotent job contract.
2. Resolve DBLink context for job execution.
3. Wrap multi-write logic in transaction context.
4. Add retry-safe guards and dedupe checks.
5. Add integration tests for retries and failure states.

# Validation

- Retries do not duplicate side effects.
- Failed jobs rollback properly.

# Common mistakes

- Non-idempotent writes.
- Missing rollback on partial failure.

# Related skills

- `create-worker`
- `security-review`

# Example from repository

Not found in current codebase.
