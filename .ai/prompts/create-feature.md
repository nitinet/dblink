# Create Feature Prompt Template

## Requirements

Describe the feature and expected observable behavior.

## Relevant modules

List affected files in `src/` and `test/`.

## Coding rules

- Preserve TypeScript strictness.
- Keep ESM `.js` import suffixes in TS files.
- Do not break public exports.

## Testing requirements

- Add failing test first.
- Add regression coverage.
- Run targeted tests and full suite when feasible.

## Documentation requirements

- Update README examples if public behavior changes.
- Update `.ai/context/*` when architecture or workflow changes.

## Acceptance criteria

- Feature behavior validated by tests.
- Build succeeds.
- No unrelated changes.
