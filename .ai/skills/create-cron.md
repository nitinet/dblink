# Purpose

Guide scheduled task creation in consumer applications using DBLink.

# When to use

- Time-based database maintenance or reporting tasks are needed.

# Prerequisites

- Scheduler exists in consumer app.

# Inputs

- Schedule expression
- Task behavior

# Outputs

- Cron task design with safe DB usage

# Files normally modified

Not found in current codebase.

# Implementation Steps

1. Define schedule and execution window.
2. Ensure task is re-entrant and idempotent.
3. Execute DB operations via context/table sets.
4. Wrap critical writes in transactions.
5. Add monitoring and alerting in consumer app.

# Validation

- Task can run repeatedly without corruption.
- Long-running queries are bounded.

# Common mistakes

- Full-table scans without limits/indexes.

# Related skills

- `create-job`
- `optimize-performance`

# Example from repository

Not found in current codebase.
