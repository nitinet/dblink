/**
 * Parsers Module
 *
 * This module provides various query parsers for the DBLink ORM,
 * including OData, Prisma, and GraphQL parsers.
 *
 * @module parsers
 */

import * as graphql from './graphql/index.js';
import * as odata from './odata/index.js';
import * as prisma from './prisma/index.js';

export { graphql, odata, prisma };

export default {
  graphql,
  odata,
  prisma
};
