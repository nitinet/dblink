# Production Issue Playbook

This repository does not include production service runtime, logs, metrics, or tracing infrastructure.

Not found in current codebase.

For consumer app incidents using DBLink:
1. Reproduce issue with minimal query path.
2. Capture generated query conditions and entity mappings.
3. Verify adapter/database connectivity.
4. Validate transaction boundaries.
5. Patch in library or consumer app as appropriate.
6. Add regression tests.
7. Roll out through consumer app deployment process.
8. Monitor error recurrence in consumer observability stack.
