# Deployment

## Purpose

Describe deployment characteristics and limits of this repository.

## Architecture

This repository packages a library for npm distribution.

Not found in current codebase for:
- Dockerfiles
- Kubernetes manifests
- CI/CD workflow files
- deployment scripts

## Responsibilities

- Build and lint source for publishable package output

## Dependencies

- npm scripts in `package.json`

## Patterns

- Build pipeline: `tsc` -> `eslint --fix` -> `prettier --write`

## Common mistakes

- Expecting service deployment docs in a library repo

## Best practices

- Validate library build before release
- Keep package exports and typings coherent

## Relevant folders

- `package.json`
- `src/`

## Mermaid diagrams

```mermaid
flowchart LR
  Source[TypeScript Source] --> Build[npm run build]
  Build --> Package[npm package artifact]
  Package --> Consumer[Downstream applications]
```

## Examples from repository

- `build` script in `package.json`
