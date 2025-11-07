/**
 * Parsers Module
 *
 * This module provides various query parsers for the DBLink ORM,
 * including OData and Prisma filter parsers.
 *
 * @module parsers
 */

import * as odata from './odata/index.js';
import * as prisma from './prisma/index.js';

export { odata, prisma };

export default {
  odata,
  prisma
};
