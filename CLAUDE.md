# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`dblink` is a decorator-based, type-safe ORM published to npm as a **library** (not an app). It has no database driver of its own: it produces a SQL statement AST and hands it to a `Handler` supplied by a separate adapter package (`dblink-pg`, `dblink-mysql`, etc.). The AST node types (`Statement`, `Expression`, `Collection`, `Operator`, `Command`, `Join`), `Handler`, and `ResultSet` all live in the **`dblink-core`** dependency — not in this repo. When a query's shape or SQL output is confusing, the answer is usually in `dblink-core`, not here.

## Commands

```bash
npm run build          # Full pipeline: tsc → eslint --fix → prettier (emits .js next to .ts)
npx tsc --noEmit       # Typecheck only
npm run eslint         # Lint + autofix ./src
npm test               # Vitest (sets TEST_DB_USER=$(whoami))
npx vitest run test/decorators.test.ts     # Single test file
npx vitest run -t "should map column"       # Single test by name pattern
```

**Tests split in two:** unit tests (decorators, query-building, type mapping) run with no database. The `Integration.test.ts` and `Context.test.ts` suites require a **live PostgreSQL** reachable by the current OS user (`TEST_DB_USER=$(whoami)`, via `dblink-pg`); without one, ~34 tests fail on connection refused — that is expected, not a regression. `vitest.config.js` sets `fileParallelism: false` and preloads `reflect-metadata`.

## Build output & packaging

Compiled `.js` files are emitted next to their `.ts` sources (`tsconfig` `outDir: "./"`) and are **gitignored** — do not commit them. They are rebuilt on `npm publish` via `prepublishOnly`, and `package.json`'s `files` allowlist ships only `src/`. `main` points at `./src/index.js` (built) and `types` at `./src/index.ts` (raw source).

## Import conventions (important)

- Module resolution is **NodeNext**. Every relative import must carry an explicit `.js` extension, even in `.ts` files (`import Foo from './Foo.js'`).
- Core types are reached via deep source paths into the dependency: `import ... from 'dblink-core/src/sql/index.js'`. Follow the existing pattern rather than inventing barrel imports.

## Architecture: how a query becomes SQL

The pipeline is **decorator metadata → field mappings → expression AST → Statement → Handler**.

1. **Decorators** (`src/decorators/`) write metadata via `reflect-metadata` under the keys in `Constants.ts` (`TABLE_KEY`, `TABLE_COLUMN_KEYS`, `COLUMN_KEY`, `ID_KEY`, `FOREIGN_KEY_TYPE`/`FOREIGN_KEY_FUNC`). `@Foreign` also applies `@Expose` for class-transformer. Nothing runs a query at decoration time — decorators only record metadata.
2. **`TableSet<T>`** (`src/collection/TableSet.ts`) is constructed per entity. In `createDbSet()` it reads that metadata and builds a `DBSet` — a `Map` of field name → `FieldMapping` (`fieldName`, `colName`, `dataType`, `isPrimary`). Primary-key fields are cached separately and drive `get`/`update`/`delete`/`upsert` WHERE clauses.
3. **`Context`** (`src/Context.ts`) is subclassed by the user, who declares `TableSet` fields (see README). `init()` reflects over its own properties, injects `context` into each `TableSet`, and registers them in `tableSetMap` (entity constructor → TableSet). That map is what powers eager-loading in `include()`.
4. **Query building** flows through two collaborating layers:
   - `TableSet` holds **persistent, per-entity** state and CRUD (`insert`, `insertAndFetch`, `insertBulk`, `update`, `upsert`, `delete`, `get`). Its chainable methods (`where`, `orderBy`, `select`, `join`, `limit`, `list`, `count`…) each spin up a **fresh** `QuerySet` via `createQuerySet()` — so a `TableSet` is reusable and queries never share mutable state.
   - `QuerySet<T>` (`src/collection/QuerySet.ts`) is the **per-query, mutable** builder. It owns a single `sql.Statement` (`this.stat`) that chainable calls mutate in place and return `this`. `IQuerySet` (`src/collection/IQuerySet.ts`) is the abstract base defining the fluent contract shared by `QuerySet`, `TableSet`, and `JoinQuerySet`.
5. **Expression builders** (`src/exprBuilder/`) turn the callbacks you pass to `where`/`orderBy`/`groupBy`/`join` into `sql.Expression` trees. `BaseExprBuilder` resolves a property name to a column via a `fieldColumnMap` (optionally alias-qualified); `WhereExprBuilder` adds the operators (`eq`, `in`, `like`, `between`, arithmetic, aggregates, pg array ops). Callbacks return an `Expression`; the QuerySet merges it into `this.stat.where` (or group/order arrays).
6. **`JoinQuerySet<T, U>`** (`src/collection/JoinQuerySet.ts`) represents a join over two `IQuerySet`s. It aliases columns as `alias_colName` in the SELECT and qualifies WHERE/ORDER refs as `alias.colName`, then merges the child statements' where/group/order into its own. Joins chain (`join()` returns a new `JoinQuerySet<T & U, A>`).
7. **Result mapping**: `QuerySet.transformer()` renames columns back to field names, uses class-transformer's `plainToInstance` to build the entity, then resolves any `include()`d foreign keys by looking up the related `TableSet` in `context.tableSetMap` and running its `foreignFunc`. `JoinQuerySet.transformer()` returns a plain merged object (no entity instantiation, no relation loading).

## Transactions

`Context.initTransaction()` returns a **new Context** via `cloneDeep`, re-links its `TableSet`s to the clone, opens a `Connection` (`src/model/Connection.ts`) around a native handler connection, and begins a transaction on it. All statement execution routes through `this.connection ?? this.handler`, so the cloned context transparently runs everything on the transaction. Call `commit()`/`rollback()` on the returned context (both also close the connection). The original context is untouched.

## `.ai/` directory

A tool-agnostic knowledge base (`context/`, `checklists/`, `playbooks/`, `skills/`). Grounded in the repo with an explicit "Not found in current codebase" rule for anything not inferable from code. Note its scope caveat: this is a library, so requests framed around controllers/APIs/deploys should be adapted to library-contribution work.
