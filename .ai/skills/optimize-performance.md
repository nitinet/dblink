# Purpose

Improve DBLink query/runtime performance without behavior changes.

# When to use

- Slow queries
- Excessive memory usage from large result sets
- High query counts from relationship loading

# Prerequisites

- Baseline measurement from tests or profiling

# Inputs

- Slow scenario
- Current query patterns

# Outputs

- Optimized query usage/code paths
- Performance regression tests or benchmarks

# Files normally modified

- `src/collection/*.ts`
- `test/*Integration*.ts`

# Implementation Steps

1. Measure baseline (latency, rows, memory).
2. Reduce selected columns using `select([...])`.
3. Use `limit()` for pagination scenarios.
4. Prefer `stream()` for large scans.
5. Profile `include()` and join paths for N+1 effects.

# Validation

- Improved metrics with unchanged functional results.

# Common mistakes

- Optimizing before measuring.
- Breaking type mapping while pruning fields.

# Related skills

- `refactor-module`
- `review-code`

# Example from repository

- Streaming support in `src/collection/QuerySet.ts`
- README performance guidance in `README.md`
