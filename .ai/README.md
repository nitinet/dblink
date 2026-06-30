# AI Knowledge System

This directory is the tool-agnostic AI operating system for this repository.

## What this repository is

DBLink is a TypeScript ORM library. It provides:
- Decorator-based entity mapping (`@Table`, `@Column`, `@Id`, `@Foreign`)
- Type-safe query composition (`where`, `orderBy`, `groupBy`, `join`, `include`)
- CRUD operations through `TableSet`
- Transaction contexts via `Context.initTransaction()`
- Raw SQL and stream support via the underlying handler

## Read order for AI agents

1. `context/architecture.md`
2. `context/folder-structure.md`
3. `context/technology-stack.md`
4. `context/database.md`
5. `context/testing.md`
6. skill docs relevant to the requested task
7. playbook docs for end-to-end execution

## Evidence rule

All documents here are grounded in current repository files.

If something cannot be inferred from code or config, it is written as:

`Not found in current codebase.`

## Scope boundaries

This is a library repository, not a deployed backend service. Requests about controllers, APIs, jobs, and deploy pipelines should be adapted to library-level contribution work unless application-layer code is added.
