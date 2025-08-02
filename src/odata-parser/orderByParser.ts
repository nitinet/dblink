import Expression from 'dblink-core/src/sql/Expression.js';
import Operator from 'dblink-core/src/sql/types/Operator.js';
import { ODataOrderByParseError } from './types.js';

/**
 * OData OrderBy Parser
 *
 * Parses OData $orderby query strings into Expression objects that can be used
 * with the existing OrderExprBuilder system.
 *
 * Supported OData orderby syntax:
 * - Simple field ordering: "name", "name asc", "name desc"
 * - Multiple field ordering: "name asc, age desc, createdAt"
 * - Default direction is ascending if not specified
 *
 * @example
 * // Simple ordering
 * orderByParser.parse("name")
 * orderByParser.parse("name asc")
 * orderByParser.parse("name desc")
 *
 * // Multiple field ordering
 * orderByParser.parse("name asc, age desc")
 * orderByParser.parse("firstName, lastName desc, createdAt asc")
 */

interface OrderByToken {
  type: 'IDENTIFIER' | 'DIRECTION' | 'COMMA';
  value: string;
  position: number;
}

interface OrderByClause {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * OData OrderBy Parser
 * Converts OData orderby expressions to SQL Expression objects
 */
export class OrderByParser {
  private tokens: OrderByToken[] = [];
  private current = 0;
  private fieldColumnMap: Map<string, string>;

  /**
   * Creates a new OData orderby parser
   * @param fieldColumnMap - Map of entity field names to database column names
   */
  constructor(fieldColumnMap: Map<string, string> = new Map()) {
    this.fieldColumnMap = fieldColumnMap;
  }

  /**
   * Parse an OData orderby string into Expression objects
   * @param orderBy - The OData orderby string
   * @returns Array of Expression objects that can be used with SQL builders
   */
  parse(orderBy: string): Expression[] {
    if (!orderBy || orderBy.trim() === '') {
      return [];
    }

    this.tokens = this.tokenize(orderBy);
    this.current = 0;

    const clauses = this.parseOrderByClauses();
    return clauses.map(clause => this.clauseToExpression(clause));
  }

  /**
   * Tokenize the OData orderby string
   */
  private tokenize(orderBy: string): OrderByToken[] {
    const tokens: OrderByToken[] = [];
    let position = 0;

    while (position < orderBy.length) {
      // Skip whitespace
      if (/\s/.test(orderBy[position])) {
        position++;
        continue;
      }

      // Comma separator
      if (orderBy[position] === ',') {
        tokens.push({ type: 'COMMA', value: ',', position });
        position++;
        continue;
      }

      // Identifiers and direction keywords
      if (/[a-zA-Z_]/.test(orderBy[position])) {
        const start = position;
        let value = '';

        while (position < orderBy.length && /[a-zA-Z0-9_]/.test(orderBy[position])) {
          value += orderBy[position];
          position++;
        }

        // Determine token type
        const lowerValue = value.toLowerCase();

        if (['asc', 'desc'].includes(lowerValue)) {
          tokens.push({ type: 'DIRECTION', value: lowerValue, position: start });
        } else {
          tokens.push({ type: 'IDENTIFIER', value, position: start });
        }
        continue;
      }

      throw new ODataOrderByParseError(`Unexpected character '${orderBy[position]}'`, position);
    }

    return tokens;
  }

  private peek(): OrderByToken | null {
    return this.current < this.tokens.length ? this.tokens[this.current] : null;
  }

  private advance(): OrderByToken | null {
    const token = this.peek();
    this.current++;
    return token;
  }

  private expect(type: OrderByToken['type'], value?: string): OrderByToken {
    const token = this.advance();
    if (!token || token.type !== type || (value && token.value !== value)) {
      throw new ODataOrderByParseError(`Expected ${type}${value ? ` '${value}'` : ''} but got ${token ? `${token.type} '${token.value}'` : 'end of input'}`, token?.position);
    }
    return token;
  }

  /**
   * Parse orderby clauses
   */
  private parseOrderByClauses(): OrderByClause[] {
    const clauses: OrderByClause[] = [];

    if (!this.peek()) {
      return clauses;
    }

    // Parse first clause
    clauses.push(this.parseOrderByClause());

    // Parse additional clauses separated by commas
    while (this.peek()?.type === 'COMMA') {
      this.advance(); // consume comma
      clauses.push(this.parseOrderByClause());
    }

    // Ensure we've consumed all tokens
    if (this.peek()) {
      const token = this.peek();
      if (token) {
        throw new ODataOrderByParseError(`Unexpected token '${token.value}'`, token.position);
      }
    }

    return clauses;
  }

  /**
   * Parse a single orderby clause (field [asc|desc])
   */
  private parseOrderByClause(): OrderByClause {
    // Expect field name
    const fieldToken = this.expect('IDENTIFIER');
    let direction: 'asc' | 'desc' = 'asc'; // Default direction

    // Check for optional direction
    const nextToken = this.peek();
    if (nextToken?.type === 'DIRECTION') {
      const directionToken = this.advance();
      if (directionToken) {
        direction = directionToken.value as 'asc' | 'desc';
      }
    }

    return {
      field: fieldToken.value,
      direction
    };
  }

  /**
   * Convert an OrderByClause to an Expression
   */
  private clauseToExpression(clause: OrderByClause): Expression {
    // Map field name to column name if mapping exists
    const columnName = this.fieldColumnMap.get(clause.field) || clause.field;
    const fieldExpression = new Expression(columnName);

    // Create ordering expression
    const operator = clause.direction === 'asc' ? Operator.Asc : Operator.Desc;
    return new Expression(null, operator, fieldExpression);
  }
}

/**
 * Create a new OData orderby parser with optional field-to-column mapping
 * @param fieldColumnMap - Map of entity field names to database column names
 * @returns New OrderByParser instance
 */
export function createOrderByParser(fieldColumnMap?: Map<string, string>): OrderByParser {
  return new OrderByParser(fieldColumnMap);
}

/**
 * Parse an OData orderby string directly
 * @param orderBy - The OData orderby string to parse
 * @param fieldColumnMap - Optional map of entity field names to database column names
 * @returns Array of Expression objects that can be used with SQL builders
 */
export function parseOrderBy(orderBy: string, fieldColumnMap?: Map<string, string>): Expression[] {
  const parser = new OrderByParser(fieldColumnMap);
  return parser.parse(orderBy);
}

export default OrderByParser;
