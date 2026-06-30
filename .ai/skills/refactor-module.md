# Purpose

Refactor DBLink modules to improve maintainability while preserving behavior.

# When to use

- Large methods are hard to reason about.
- Duplicate logic appears across query modules.

# Prerequisites

- Existing tests around module behavior

# Inputs

- Refactor target and goals

# Outputs

- Cleaner module structure
- Unchanged public behavior

# Files normally modified

- `src/**/*.ts`
- `test/**/*.test.ts`

# Implementation Steps

1. Capture current behavior with tests.
2. Identify extraction boundaries (helpers/utilities).
3. Refactor incrementally with small commits.
4. Keep public signatures stable unless explicitly changing API.
5. Re-run full test suite.

# Validation

- No behavior regressions in existing tests.
- Complexity/readability improved.

# Common mistakes

- Mixing refactor and feature changes in one patch.

# Related skills

- `review-code`
- `create-test`

# Example from repository

- Existing helper extraction patterns in `src/collection/TableSet.ts` (`getAllFields`, `getUpdateFields`)
