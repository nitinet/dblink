# Bug Fix Playbook

1. Reproduce with a focused failing test.
2. Classify defect area: metadata, query composition, execution, transformation, transaction.
3. Identify smallest corrective change in `src/`.
4. Implement fix without unrelated refactor.
5. Add/strengthen regression tests.
6. Run targeted tests first, then broader suite.
7. Validate no API contract break.
8. Document root cause and prevention notes in PR.
