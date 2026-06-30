# Purpose

Review DBLink changes for security concerns relevant to ORM/query libraries.

# When to use

- Query composition logic changes
- Serialization/transformation behavior changes
- Transaction and connection handling changes

# Prerequisites

- Access to changed files and tests

# Inputs

- Diff
- Threat assumptions

# Outputs

- Security findings and mitigation recommendations

# Files normally modified

Not found in current codebase.

(Security review output is generally external to source files.)

# Implementation Steps

1. Check query parameterization paths in expression builders.
2. Validate no raw string interpolation was introduced in risky paths.
3. Review metadata access for unsafe reflection misuse.
4. Review transaction lifecycle for resource leaks.
5. Ensure error messages avoid sensitive leakage in consumer-facing layers.

# Validation

- Parameterized expressions still used for values.
- No new direct SQL injection vectors in core APIs.

# Common mistakes

- Assuming library can enforce app-level authn/authz.

# Related skills

- `review-code`
- `fix-bug`

# Example from repository

- Parameterized operands in `src/exprBuilder/WhereExprBuilder.ts`
- Statement execution delegation in `src/Context.ts`
