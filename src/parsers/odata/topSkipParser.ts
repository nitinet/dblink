import Expression from 'dblink-core/src/sql/Expression.js';
import Operator from 'dblink-core/src/sql/types/Operator.js';
import { ODataTopSkipParseError } from './types.js';

/**
 * OData Top/Skip Parser
 *
 * Parses OData $top and $skip query parameters into Expression objects that can be used
 * with the existing limit system.
 *
 * Supported OData pagination parameters:
 * - $top: Specifies the number of items to return (equivalent to LIMIT/TAKE)
 * - $skip: Specifies the number of items to skip (equivalent to OFFSET)
 *
 * @example
 * // OData pagination parameters
 * topSkipParser.parse({ top: 10 })           // Take 10 items
 * topSkipParser.parse({ skip: 20 })          // Skip 20 items
 * topSkipParser.parse({ top: 10, skip: 20 }) // Skip 20, take 10
 *
 * // Convert OData parameters to DBLink limit expressions
 * const limitExpr = parseTopSkip("$top=10&$skip=20")
 */

interface TopSkipParams {
  top?: number;
  skip?: number;
}

interface TopSkipQueryParams {
  $top?: string | number;
  $skip?: string | number;
}

/**
 * OData Top/Skip Parser
 * Converts OData $top and $skip parameters to SQL Expression objects for pagination
 */
export class TopSkipParser {
  /**
   * Parse top/skip parameters into a DBLink-compatible limit Expression
   *
   * @param params - The top/skip parameters
   * @returns Expression object compatible with DBLink's limit system, or null if no pagination
   */
  parse(params: TopSkipParams): Expression | null {
    const { top, skip } = params;

    // Validate parameters
    if (top !== undefined && (!Number.isInteger(top) || top < 0)) {
      throw new ODataTopSkipParseError('Top value must be a non-negative integer', 'top');
    }

    if (skip !== undefined && (!Number.isInteger(skip) || skip < 0)) {
      throw new ODataTopSkipParseError('Skip value must be a non-negative integer', 'skip');
    }

    // If no pagination parameters provided, return null
    if (top === undefined && skip === undefined) {
      return null;
    }

    // Create limit expression using DBLink's Operator.Limit
    const limitExpr = new Expression(null, Operator.Limit);

    // Add top (size/count) parameter - if not specified, use a large default for skip-only queries
    const topValue = top !== undefined ? top : Number.MAX_SAFE_INTEGER;
    limitExpr.exps.push(new Expression(topValue.toString()));

    // Add skip (offset/index) parameter if specified
    if (skip !== undefined && skip > 0) {
      limitExpr.exps.push(new Expression(skip.toString()));
    }

    return limitExpr;
  }

  /**
   * Parse query string parameters into top/skip values
   *
   * @param queryParams - Query parameters object (e.g., from URL query string)
   * @returns TopSkipParams object
   */
  parseFromQuery(queryParams: TopSkipQueryParams): TopSkipParams {
    const result: TopSkipParams = {};

    // Parse $top parameter
    if (queryParams.$top !== undefined) {
      const topValue = typeof queryParams.$top === 'string' ? parseInt(queryParams.$top, 10) : queryParams.$top;

      if (isNaN(topValue)) {
        throw new ODataTopSkipParseError('Top parameter must be a valid integer', '$top');
      }
      result.top = topValue;
    }

    // Parse $skip parameter
    if (queryParams.$skip !== undefined) {
      const skipValue = typeof queryParams.$skip === 'string' ? parseInt(queryParams.$skip, 10) : queryParams.$skip;

      if (isNaN(skipValue)) {
        throw new ODataTopSkipParseError('Skip parameter must be a valid integer', '$skip');
      }
      result.skip = skipValue;
    }

    return result;
  }

  /**
   * Parse URL query string into a limit Expression
   *
   * @param queryString - URL query string (e.g., "$top=10&$skip=20")
   * @returns Expression object or null if no pagination parameters
   */
  parseFromQueryString(queryString: string): Expression | null {
    const params = new URLSearchParams(queryString);
    const queryParams: TopSkipQueryParams = {};

    if (params.has('$top')) {
      const topValue = params.get('$top');
      if (topValue !== null) {
        queryParams.$top = topValue;
      }
    }

    if (params.has('$skip')) {
      const skipValue = params.get('$skip');
      if (skipValue !== null) {
        queryParams.$skip = skipValue;
      }
    }

    const topSkipParams = this.parseFromQuery(queryParams);
    return this.parse(topSkipParams);
  }
}

/**
 * Utility function to parse OData top/skip parameters into a DBLink limit Expression
 *
 * @param params - Top/skip parameters
 * @returns Expression object or null if no pagination
 */
export function parseTopSkip(params: TopSkipParams): Expression | null {
  const parser = new TopSkipParser();
  return parser.parse(params);
}

/**
 * Utility function to parse OData query parameters into a DBLink limit Expression
 *
 * @param queryParams - Query parameters object with $top and/or $skip
 * @returns Expression object or null if no pagination
 */
export function parseTopSkipFromQuery(queryParams: TopSkipQueryParams): Expression | null {
  const parser = new TopSkipParser();
  const topSkipParams = parser.parseFromQuery(queryParams);
  return parser.parse(topSkipParams);
}

/**
 * Utility function to parse URL query string into a DBLink limit Expression
 *
 * @param queryString - URL query string
 * @returns Expression object or null if no pagination
 */
export function parseTopSkipFromQueryString(queryString: string): Expression | null {
  const parser = new TopSkipParser();
  return parser.parseFromQueryString(queryString);
}

/**
 * Convert top/skip parameters to DBLink limit method parameters
 *
 * @param params - Top/skip parameters
 * @returns Object with size and index for DBLink's limit(size, index) method
 */
export function topSkipToLimitParams(params: TopSkipParams): { size?: number; index?: number } {
  const { top, skip } = params;

  const result: { size?: number; index?: number } = {};

  if (top !== undefined) {
    result.size = top;
  }

  if (skip !== undefined) {
    result.index = skip;
  }

  return result;
}

/**
 * Extract top/skip values from a DBLink limit Expression
 *
 * @param limitExpr - DBLink limit Expression
 * @returns TopSkipParams object with extracted values
 */
export function limitExpressionToTopSkip(limitExpr: Expression): TopSkipParams {
  if (limitExpr.operator !== Operator.Limit || limitExpr.exps.length === 0) {
    throw new ODataTopSkipParseError('Invalid limit expression provided');
  }

  const result: TopSkipParams = {};

  // First expression is always the size (top)
  const topExpr = limitExpr.exps[0];
  if (topExpr && topExpr.value) {
    const topValue = parseInt(topExpr.value, 10);
    if (!isNaN(topValue) && topValue !== Number.MAX_SAFE_INTEGER) {
      result.top = topValue;
    }
  }

  // Second expression is the offset (skip) if present
  if (limitExpr.exps.length > 1) {
    const skipExpr = limitExpr.exps[1];
    if (skipExpr && skipExpr.value) {
      const skipValue = parseInt(skipExpr.value, 10);
      if (!isNaN(skipValue)) {
        result.skip = skipValue;
      }
    }
  }

  return result;
}
