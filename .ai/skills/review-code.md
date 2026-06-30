# Purpose

Review DBLink changes for correctness, safety, API stability, and performance.

# When to use

- Before merge or release
- After feature/bugfix implementation

# Prerequisites

- Access to diff and impacted tests

# Inputs

- Code diff
- Test results

# Outputs

- Findings by severity
- Required fixes
- Risk notes

# Files normally modified

Not found in current codebase.

(Review artifact is typically in PR comments, not repo files.)

# Implementation Steps

1. Check API surface changes in `src/index.ts` and exported modules.
2. Verify metadata contract stability in decorators/constants.
3. Verify query behavior in `TableSet`, `QuerySet`, `JoinQuerySet`.
4. Check transaction safety in `Context`/`Connection`.
5. Confirm tests cover changed behavior.

# Validation

- No critical/high defects remain.
- Tests pass in expected environment.

# Common mistakes

- Missing integration impact for adapter behavior.
- Ignoring performance implications of include/join expansion.

# Related skills

- `security-review`
- `optimize-performance`

# Example from repository

- Public export contract in `src/index.ts`
- Query + join semantics in `test/QueryBuilding.test.ts`
