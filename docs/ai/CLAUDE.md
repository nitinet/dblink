# CLAUDE

## Repository map

- Core entry: `src/index.ts`
- Context and transactions: `src/Context.ts`, `src/model/Connection.ts`
- Query abstractions: `src/collection/*.ts`
- Decorators: `src/decorators/*.ts`
- Expression builders: `src/exprBuilder/*.ts`
- Tests: `test/*.test.ts`, `test/model/*.ts`

## Most frequently edited folders

- `src/collection`
- `src/exprBuilder`
- `src/decorators`
- `test`

## Development workflow

1. Read relevant `.ai/context` docs.
2. Reproduce issue or define behavior with tests.
3. Edit TypeScript source only.
4. Run build and targeted tests.
5. Run broader suite if environment is available.

## Refactoring workflow

1. Add safety tests first.
2. Refactor in small steps.
3. Preserve public method signatures unless requested.
4. Verify generated JS sync after build.

## Safe edit strategy

- Prefer smallest functional change.
- Avoid unrelated formatting churn.
- Keep metadata and type contracts stable.

## Context loading strategy

Load in this order:
1. `.ai/context/architecture.md`
2. `.ai/context/folder-structure.md`
3. `.ai/context/database.md`
4. `.ai/context/testing.md`
5. Relevant skill/playbook for the task

## Common commands

- `npm run build`
- `npm test`
- `npx vitest run test/<target>.test.ts`
- `rg --files`
- `rg -n "pattern" src test docs`

## Search strategy

- Start with `src/index.ts` exports.
- Follow symbols through `src/collection` and `src/exprBuilder`.
- Confirm behavior in tests before changing implementation.

## Testing strategy

- Prefer failing test first for bug/feature changes.
- Separate fast unit-like checks from DB integration tests.
- For integration tests, ensure local PostgreSQL and env vars.

## Review strategy

- Check for regressions in query semantics.
- Check transaction lifecycle correctness.
- Check metadata compatibility and API surface stability.
