# Release Playbook

1. Confirm intended version bump and changelog scope.
2. Run `npm run build` and resolve lint/format/type issues.
3. Run tests (`npm test`) with required DB environment available.
4. Verify generated JS is in sync with TS source.
5. Review public exports and README examples.
6. Tag release and publish package according to team process.

Automated release workflow files: Not found in current codebase.
