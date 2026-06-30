# Purpose

Define DTO patterns for consumer applications integrating with DBLink.

# When to use

- Input/output contracts must be decoupled from entities.

# Prerequisites

- Service or API layer exists in consumer repo.

# Inputs

- External contract fields
- Domain/entity fields

# Outputs

- DTO types and mapping strategy

# Files normally modified

Not found in current codebase.

# Implementation Steps

1. Define DTO schema separate from entity class.
2. Map DTO -> entity fields explicitly.
3. Restrict writable fields (avoid accidental PK/readonly updates).
4. Map entity -> response DTO.
5. Add tests for mapping correctness.

# Validation

- DTO contract remains stable when entity changes.
- No hidden field leakage.

# Common mistakes

- Reusing entity classes as external API contracts.

# Related skills

- `create-controller`
- `create-service`

# Example from repository

Not found in current codebase.
