# Purpose

Guide implementation of worker processes that use DBLink.

# When to use

- Long-running or async workloads need DB access.

# Prerequisites

- Worker runtime exists in consumer application.

# Inputs

- Work item payload
- Throughput and retry policies

# Outputs

- Worker logic using DBLink safely and efficiently

# Files normally modified

Not found in current codebase.

# Implementation Steps

1. Initialize DBLink context once per worker process.
2. Parse and validate work item payload.
3. Execute bounded queries and transactional writes.
4. Handle failures with retry-safe behavior.
5. Add telemetry in consumer app.

# Validation

- Worker handles partial failures cleanly.
- Database connections are released.

# Common mistakes

- Creating new connection context per item unnecessarily.

# Related skills

- `create-job`
- `optimize-performance`

# Example from repository

Not found in current codebase.
