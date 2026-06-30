# Purpose

Provide guidance for controller creation in consumer services using DBLink.

# When to use

- Building HTTP handlers that call DBLink-backed services.

# Prerequisites

- Existing web framework and service layer in consumer repo.

# Inputs

- Endpoint contract
- Validation rules
- Service methods

# Outputs

- Controller handlers mapped to service calls

# Files normally modified

Not found in current codebase.

# Implementation Steps

1. Validate and parse request inputs.
2. Call service methods that use DBLink query APIs.
3. Map service errors to HTTP status codes.
4. Return stable response shape.
5. Add integration tests for handler behavior.

# Validation

- Endpoints enforce input constraints.
- Errors are translated consistently.

# Common mistakes

- Query building directly in controller.
- Leaking SQL/ORM errors without mapping.

# Related skills

- `create-service`
- `create-api`
- `security-review`

# Example from repository

Not found in current codebase.
