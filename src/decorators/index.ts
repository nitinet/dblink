/**
 * Decorators Module
 *
 * This module provides TypeScript decorators for defining database entities and their properties.
 * It includes decorators for marking classes as database tables, properties as columns,
 * and designating primary keys.
 *
 * @module decorators
 */
import Column from './Column.js';
import Foreign from './Foreign.js';
import Id from './Id.js';
import Table from './Table.js';

export { Column, Foreign, Id, Table };
