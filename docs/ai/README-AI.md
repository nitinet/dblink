# README-AI

This repository includes a tool-agnostic AI operating manual under `.ai/`.

## How AI agents should use this repository

1. Understand this is a library repository, not a full backend service.
2. Ground all changes in existing code and tests.
3. If requested capability is absent, state: `Not found in current codebase.`

## Which files to read first

1. `.ai/context/architecture.md`
2. `.ai/context/folder-structure.md`
3. `.ai/context/technology-stack.md`
4. `.ai/context/database.md`
5. `.ai/context/testing.md`

## How skills are organized

`.ai/skills/` contains task-specific guides (creation, bug fixing, review, optimization, refactoring, security).

## How playbooks work

`.ai/playbooks/` provides end-to-end multi-step workflows for common engineering tasks.

## How prompts work

`.ai/prompts/` provides reusable prompt templates for implementation and review tasks.

## How context documents work

`.ai/context/` documents architecture, stack, conventions, and constraints with diagrams and repository references.

## Notes on absent systems

This repository does not currently include application-layer controllers, background workers, queue infrastructure, or deployment manifests.

These are explicitly marked in docs as `Not found in current codebase.`
