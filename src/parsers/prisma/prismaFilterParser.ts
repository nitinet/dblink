import Expression from 'dblink-core/src/sql/Expression.js';
import Operator from 'dblink-core/src/sql/types/Operator.js';
import { PrismaFilterParseError } from './types.js';

/**
 * Prisma Filter Parser
 *
 * Parses Prisma-style filter objects into Expression objects that can be used
 * with the existing WhereExprBuilder system.
 *
 * Supported Prisma operators:
 * - Comparison: equals, not, gt, gte, lt, lte
 * - String: contains, startsWith, endsWith, in, notIn
 * - Logical: AND, OR, NOT
 * - Null checks: null, isNull
 *
 * @example
 * // Basic comparison
 * prismaParser.parse({ name: { equals: 'John' } })
 *
 * // Shorthand equality
 * prismaParser.parse({ name: 'John', age: 25 })
 *
 * // Logical operators
 * prismaParser.parse({ AND: [{ name: 'John' }, { age: { gt: 25 } }] })
 *
 * // String operations
 * prismaParser.parse({ name: { contains: 'John' } })
 *
 * // Complex expressions
 * prismaParser.parse({
 *   OR: [
 *     { name: 'John' },
 *     { AND: [{ age: { gt: 18 } }, { status: 'active' }] }
 *   ]
 * })
 */

/**
 * Prisma filter type definitions
 */
type PrismaScalarFilter = {
  equals?: unknown;
  not?: unknown;
  in?: unknown[];
  notIn?: unknown[];
  lt?: unknown;
  lte?: unknown;
  gt?: unknown;
  gte?: unknown;
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  mode?: 'default' | 'insensitive';
};

type PrismaLogicalFilter = {
  AND?: PrismaWhereInput | PrismaWhereInput[];
  OR?: PrismaWhereInput | PrismaWhereInput[];
  NOT?: PrismaWhereInput | PrismaWhereInput[];
};

type PrismaWhereInput = PrismaLogicalFilter & {
  [field: string]: unknown | PrismaScalarFilter;
};

/**
 * Prisma Filter Parser
 * Converts Prisma-style filter objects to SQL Expression objects
 */
export class PrismaFilterParser {
  private fieldColumnMap: Map<string, string>;

  /**
   * Creates a new Prisma filter parser
   * @param fieldColumnMap - Map of entity field names to database column names
   */
  constructor(fieldColumnMap: Map<string, string> = new Map()) {
    this.fieldColumnMap = fieldColumnMap;
  }

  /**
   * Parse a Prisma filter object into an Expression
   * @param filter - The Prisma filter object
   * @returns Expression object that can be used with SQL builders
   */
  parse(filter: PrismaWhereInput | null | undefined): Expression {
    if (!filter || Object.keys(filter).length === 0) {
      return new Expression();
    }

    return this.parseWhereInput(filter);
  }

  /**
   * Parse a Prisma where input object
   */
  private parseWhereInput(filter: PrismaWhereInput): Expression {
    const expressions: Expression[] = [];

    for (const [key, value] of Object.entries(filter)) {
      // Handle logical operators
      if (key === 'AND') {
        const expr = this.parseLogicalAND(value as PrismaWhereInput | PrismaWhereInput[]);
        if (expr && expr.exps.length > 0) {
          expressions.push(expr);
        }
      } else if (key === 'OR') {
        const expr = this.parseLogicalOR(value as PrismaWhereInput | PrismaWhereInput[]);
        if (expr && expr.exps.length > 0) {
          expressions.push(expr);
        }
      } else if (key === 'NOT') {
        const expr = this.parseLogicalNOT(value as PrismaWhereInput | PrismaWhereInput[]);
        if (expr && expr.exps.length > 0) {
          expressions.push(expr);
        }
      } else {
        // Handle field filters
        const expr = this.parseFieldFilter(key, value);
        if (expr && expr.exps.length > 0) {
          expressions.push(expr);
        }
      }
    }

    // Combine all expressions with AND
    if (expressions.length === 0) {
      return new Expression();
    }

    if (expressions.length === 1) {
      return expressions[0];
    }

    return new Expression(null, Operator.And, ...expressions);
  }

  /**
   * Parse AND logical operator
   */
  private parseLogicalAND(value: PrismaWhereInput | PrismaWhereInput[]): Expression {
    const filters = Array.isArray(value) ? value : [value];
    const expressions = filters.map(f => this.parseWhereInput(f)).filter(e => e.exps.length > 0);

    if (expressions.length === 0) {
      return new Expression();
    }

    if (expressions.length === 1) {
      return expressions[0];
    }

    return new Expression(null, Operator.And, ...expressions);
  }

  /**
   * Parse OR logical operator
   */
  private parseLogicalOR(value: PrismaWhereInput | PrismaWhereInput[]): Expression {
    const filters = Array.isArray(value) ? value : [value];
    const expressions = filters.map(f => this.parseWhereInput(f)).filter(e => e.exps.length > 0);

    if (expressions.length === 0) {
      return new Expression();
    }

    if (expressions.length === 1) {
      return expressions[0];
    }

    return new Expression(null, Operator.Or, ...expressions);
  }

  /**
   * Parse NOT logical operator
   */
  private parseLogicalNOT(value: PrismaWhereInput | PrismaWhereInput[]): Expression {
    const filters = Array.isArray(value) ? value : [value];
    const expressions = filters.map(f => this.parseWhereInput(f)).filter(e => e.exps.length > 0);

    if (expressions.length === 0) {
      return new Expression();
    }

    // NOT is applied to the AND of all expressions
    let innerExpr: Expression;
    if (expressions.length === 1) {
      innerExpr = expressions[0];
    } else {
      innerExpr = new Expression(null, Operator.And, ...expressions);
    }

    return new Expression(null, Operator.Not, innerExpr);
  }

  /**
   * Parse a field filter
   */
  private parseFieldFilter(field: string, value: unknown): Expression {
    // Get the column name from the field map
    const columnName = this.fieldColumnMap.get(field) || field;

    // Handle null/undefined values - treat as equals null
    if (value === null || value === undefined) {
      return this.createComparison(columnName, Operator.IsNull);
    }

    // Handle primitive values (shorthand for equals)
    if (typeof value !== 'object' || value instanceof Date) {
      return this.createComparison(columnName, Operator.Equal, value);
    }

    // Handle filter operators
    const expressions: Expression[] = [];

    for (const [operator, operand] of Object.entries(value)) {
      const expr = this.parseOperator(columnName, operator, operand);
      if (expr && expr.exps.length > 0) {
        expressions.push(expr);
      }
    }

    if (expressions.length === 0) {
      return new Expression();
    }

    if (expressions.length === 1) {
      return expressions[0];
    }

    // Multiple operators on the same field are combined with AND
    return new Expression(null, Operator.And, ...expressions);
  }

  /**
   * Parse a specific operator
   */
  private parseOperator(columnName: string, operator: string, operand: unknown): Expression {
    switch (operator) {
      case 'equals':
        return this.createComparison(columnName, Operator.Equal, operand);

      case 'not':
        if (operand === null || operand === undefined) {
          return this.createComparison(columnName, Operator.IsNotNull);
        }
        return this.createComparison(columnName, Operator.NotEqual, operand);

      case 'in':
        if (!Array.isArray(operand)) {
          throw new PrismaFilterParseError(`'in' operator requires an array value for field '${columnName}'`);
        }
        return this.createComparison(columnName, Operator.In, operand);

      case 'notIn': {
        if (!Array.isArray(operand)) {
          throw new PrismaFilterParseError(`'notIn' operator requires an array value for field '${columnName}'`);
        }
        // NOT IN is implemented as NOT (field IN (...))
        const inExpr = this.createComparison(columnName, Operator.In, operand);
        return new Expression(null, Operator.Not, inExpr);
      }

      case 'lt':
        return this.createComparison(columnName, Operator.LessThan, operand);

      case 'lte':
        return this.createComparison(columnName, Operator.LessThanEqual, operand);

      case 'gt':
        return this.createComparison(columnName, Operator.GreaterThan, operand);

      case 'gte':
        return this.createComparison(columnName, Operator.GreaterThanEqual, operand);

      case 'contains':
        // LIKE %value%
        return this.createComparison(columnName, Operator.Like, `%${operand}%`);

      case 'startsWith':
        // LIKE value%
        return this.createComparison(columnName, Operator.Like, `${operand}%`);

      case 'endsWith':
        // LIKE %value
        return this.createComparison(columnName, Operator.Like, `%${operand}`);

      case 'mode':
        // Ignore case-sensitivity mode for now (handled by database settings)
        return new Expression();

      default:
        throw new PrismaFilterParseError(`Unsupported operator '${operator}' for field '${columnName}'`);
    }
  }

  /**
   * Create a comparison expression
   */
  private createComparison(columnName: string, operator: Operator, value?: unknown): Expression {
    const field = new Expression(columnName);

    if (operator === Operator.IsNull || operator === Operator.IsNotNull) {
      return new Expression(null, operator, field);
    }

    const valueExpr = new Expression('?');
    valueExpr.args.push(value);

    return new Expression(null, operator, field, valueExpr);
  }
}

/**
 * Create a new Prisma filter parser with optional field-to-column mapping
 * @param fieldColumnMap - Map of entity field names to database column names
 * @returns New PrismaFilterParser instance
 */
export function createPrismaFilterParser(fieldColumnMap?: Map<string, string>): PrismaFilterParser {
  return new PrismaFilterParser(fieldColumnMap);
}

/**
 * Parse a Prisma filter object directly
 * @param filter - The Prisma filter object to parse
 * @param fieldColumnMap - Optional map of entity field names to database column names
 * @returns Expression object that can be used with SQL builders
 */
export function parsePrismaFilter(filter: PrismaWhereInput | null | undefined, fieldColumnMap?: Map<string, string>): Expression {
  const parser = new PrismaFilterParser(fieldColumnMap);
  return parser.parse(filter);
}

export default PrismaFilterParser;
