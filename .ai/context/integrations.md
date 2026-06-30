# Integrations

## Purpose

Describe external systems and packages integrated by this repository.

## Architecture

Core integration points:
- `dblink-core` SQL and handler abstraction
- DB adapter integration via separate packages (`dblink-pg` in tests)
- Serialization integration via `class-transformer`

## Responsibilities

- Keep adapter contract stable through `Handler` usage
- Keep entity transformation behavior deterministic

## Dependencies

- Runtime: `dblink-core`, `class-transformer`, `reflect-metadata`, `lodash-es`
- Test/dev: `dblink-pg`

## Patterns

- Adapter plug-in model per database vendor
- Minimal direct coupling to one SQL dialect in core source

## Common mistakes

- Assuming `dblink-pg` is a runtime dependency of this package
- Mixing adapter-specific SQL into core abstractions

## Best practices

- Preserve generic interfaces in core package
- Validate adapter interoperability through integration tests

## Relevant folders

- `src/Context.ts`
- `src/model/Connection.ts`
- `package.json`
- `test/Integration.test.ts`

## Mermaid diagrams

```mermaid
flowchart LR
  DBLink --> dblink-core
  DBLink --> class-transformer
  DBLink --> reflect-metadata
  Tests --> dblink-pg
  dblink-pg --> PostgreSQL
```

## Examples from repository

- Adapter instantiation in `test/Integration.test.ts`
- `plainToInstance` in `src/collection/QuerySet.ts`
