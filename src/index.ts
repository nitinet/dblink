/**
 * DBLink - Object-Relational Mapping (ORM) Library
 *
 * This library provides a TypeScript-friendly ORM with decorator-based entity mapping,
 * strongly-typed queries, and transaction support.
 *
 * @module dblink
 */
import * as core from 'dblink-core';
import 'reflect-metadata';
import Context from './Context.js';
import * as collection from './collection/index.js';
import * as decorators from './decorators/index.js';
import * as exprBuilder from './exprBuilder/index.js';
import * as expression from './expression/index.js';

export { Context, collection, core, decorators, exprBuilder, expression };
