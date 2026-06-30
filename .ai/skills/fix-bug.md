# Purpose

Fix defects in DBLink behavior with low regression risk.

# When to use

- Failing tests
- Runtime errors in query/metadata/transaction paths

# Prerequisites

- Reproducible failure case
- Understanding of affected module (`Context`, `TableSet`, `QuerySet`, decorators)

# Inputs

- Bug report
- Stack trace
- Repro steps

# Outputs

- Minimal code fix
- Regression test coverage

# Files normally modified

- `src/**/*.ts`
- `test/**/*.test.ts`

# Implementation Steps

1. Reproduce with focused test.
2. Identify failing layer: metadata, query AST, execution, transformation.
3. Apply smallest safe fix.
4. Add/adjust regression tests.
5. Run targeted and broader tests.

# Validation

- Repro case passes.
- Related behavior unchanged.

# Common mistakes

- Fixing generated `.js` only.
- Broad refactors while patching urgent bug.

# Related skills

- `create-test`
- `review-code`
- `security-review`

# Example from repository

- Error handling paths in `src/Context.ts` (`Transaction Not Started`)
- Join validation in `src/collection/QuerySet.ts` and `src/collection/JoinQuerySet.ts`
