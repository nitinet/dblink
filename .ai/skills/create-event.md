# Purpose

Define event-driven integration patterns around DBLink operations.

# When to use

- Application emits events after successful DB commits.

# Prerequisites

- Event bus exists in consumer app.

# Inputs

- Event schema
- Triggering DB operation

# Outputs

- Event emission workflow aligned with transaction boundaries

# Files normally modified

Not found in current codebase.

# Implementation Steps

1. Identify DB state change that should emit event.
2. Execute write in transaction context.
3. Emit event only after successful commit.
4. Add idempotency keys for at-least-once delivery.
5. Test commit/emission ordering.

# Validation

- No event emitted on rollback.
- Event payload aligns with committed data.

# Common mistakes

- Emitting before commit.

# Related skills

- `create-service`
- `security-review`

# Example from repository

Not found in current codebase.
