# Database Change Playbook

1. Define schema intent and compatibility impact.
2. Identify entity decorator updates required (`@Column`, `@Id`, `@Foreign`).
3. Create migration in consumer app tooling.
4. Update DBLink usage paths (`TableSet`/`QuerySet`) for renamed/new fields.
5. Verify transaction boundaries for multi-step data migration.
6. Add migration regression tests in consumer app and ORM behavior tests here if needed.
7. Document rollback strategy.
8. Validate with integration tests against real DB.
9. Update docs and changelog notes.

Migration framework in this repo: Not found in current codebase.
