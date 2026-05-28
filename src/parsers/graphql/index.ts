/**
 * GraphQL Parser Module
 *
 * Provides GraphQL query parsing and introspection for DBLink QuerySets.
 *
 * ## Query parsing
 * Parse an incoming GraphQL query string and apply the extracted parameters
 * (field selection, where filters, ordering, pagination) to a QuerySet:
 *
 * ```typescript
 * import { parsers } from 'dblink';
 * const { QueryParser } = parsers.graphql;
 *
 * const fieldColumnMap = new Map([['firstName', 'first_name'], ['lastName', 'last_name']]);
 * const parser = new QueryParser(fieldColumnMap);
 *
 * const result = parser.parse(`
 *   query {
 *     employees(
 *       where: { firstName: { eq: "John" }, age: { gt: 18 } }
 *       orderBy: { lastName: "asc" }
 *       first: 10
 *       skip: 0
 *     ) {
 *       id
 *       firstName
 *       lastName
 *     }
 *   }
 * `);
 *
 * if (result.success) {
 *   const { fields, where, orderBy, first, skip } = result.params;
 *
 *   let qs = db.employees;
 *   if (fields.length > 0)          qs = qs.select(fields);
 *   if (where)                       qs = qs.where(() => parser.buildWhereExpression(where));
 *   if (first !== undefined)         qs = qs.limit(first, skip);
 *   // orderBy is left as an exercise since it requires OrderExprBuilder access
 *
 *   const data = await qs.list();
 * }
 * ```
 *
 * ## Introspection
 * Expose a `__schema` / `__type` introspection API for any registered entity:
 *
 * ```typescript
 * const { IntrospectionProvider } = parsers.graphql;
 *
 * const provider = new IntrospectionProvider()
 *   .register(Employee)
 *   .register(Department);
 *
 * // In an Express handler:
 * app.post('/graphql', (req, res) => {
 *   const body = req.body as { query: string };
 *   if (body.query.includes('__schema') || body.query.includes('__type')) {
 *     return res.json(provider.execute(body.query));
 *   }
 *   // … delegate to query parser
 * });
 * ```
 *
 * @module parsers/graphql
 */

export * from './types.js';
export { QueryParser } from './queryParser.js';
export { IntrospectionProvider } from './introspection.js';

import { QueryParser } from './queryParser.js';
import { IntrospectionProvider } from './introspection.js';

export default {
  QueryParser,
  IntrospectionProvider
};
