# New Feature Playbook

1. Understand requirement and expected API behavior.
2. Find similar implementation in `src/collection`, `src/exprBuilder`, or existing tests.
3. Add or update metadata/decorator needs if entity mapping changes.
4. Update query/collection logic with minimal surface change.
5. Add tests first for expected behavior (unit-style and integration if required).
6. Implement feature to satisfy tests.
7. Update README/docs if public behavior changed.
8. Run `npm run build`.
9. Run `npm test` with PostgreSQL available for integration coverage.
10. Prepare PR summary with behavior, risks, and test evidence.
