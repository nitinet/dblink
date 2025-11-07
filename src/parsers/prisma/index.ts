/**
 * Prisma Parser Module
 *
 * This module provides Prisma-style filter parsing capabilities
 * with full type safety for use with the DBLink ORM.
 *
 * @module parsers/prisma
 */

import PrismaFilterParser from './filterParser.js';

export { PrismaFilterParser, createPrismaFilterParser, parsePrismaFilter } from './filterParser.js';
export * from './types.js';

export default {
  PrismaFilterParser
};
