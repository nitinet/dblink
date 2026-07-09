---
description: Security review of dblink changes, focused on ORM/query-library risks
argument-hint: [optional: area or diff to focus]
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*)
---

Perform a security review of the pending changes to this dblink ORM library, using the threat model of a query-building library. Read @CLAUDE.md for architecture. Start from `git diff` (focus: $ARGUMENTS if provided).

## What to check
1. **Parameterization** — value operands must remain parameterized `Expression('?')` with args (see `WhereExprBuilder._argExp`, `in`, `between`). Flag any new raw string interpolation of values into SQL in `src/exprBuilder/` or `src/collection/`.
2. **SQL injection vectors** — column/alias names derive from decorator metadata, not user input; confirm no user-controlled string reaches a statement unescaped.
3. **Reflection safety** — no unsafe `Reflect` metadata misuse introduced in decorators/collection.
4. **Transaction/connection lifecycle** — connections opened in `Context.initTransaction()` must always close on commit/rollback; check for leaks.
5. **Error messages** — consumer-facing errors must not leak sensitive runtime internals.
6. **Dependencies** — new/updated deps reviewed for advisories.

## Scope boundary
This is a library: it cannot enforce app-level authn/authz. Do not report missing application-layer controls as defects — note them as consumer responsibilities.

Report findings with severity, location, and mitigation.
