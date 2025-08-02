import Expression from 'dblink-core/src/sql/Expression.js';
import Operator from 'dblink-core/src/sql/types/Operator.js';
import { ODataFilterParseError as ODataParseError } from './types.js';

/**
 * OData Filter Parser
 *
 * Parses OData $filter query strings into Expression objects that can be used
 * with the existing WhereExprBuilder system.
 *
 * Supported OData operators:
 * - Comparison: eq, ne, gt, ge, lt, le
 * - Logical: and, or, not
 * - String functions: contains, startswith, endswith
 * - Math functions: add, sub, mul, div
 * - Collection: in
 * - Null checks: null (implicit)
 *
 * Note: Advanced functions like length, date functions (year, month, etc.),
 * and modulo are not currently supported but can be added in future versions.
 *
 * @example
 * // Basic comparison
 * filterParser.parse("name eq 'John'")
 *
 * // Logical operators
 * filterParser.parse("name eq 'John' and age gt 25")
 *
 * // String functions
 * filterParser.parse("contains(name, 'John')")
 *
 * // Complex expressions
 * filterParser.parse("(name eq 'John' or name eq 'Jane') and age gt 18")
 */

interface ODataToken {
  type: 'IDENTIFIER' | 'STRING' | 'NUMBER' | 'BOOLEAN' | 'NULL' | 'OPERATOR' | 'FUNCTION' | 'LPAREN' | 'RPAREN' | 'COMMA';
  value: string;
  position: number;
}

interface ODataASTNode {
  type: 'BinaryExpression' | 'UnaryExpression' | 'FunctionCall' | 'Literal' | 'Identifier';
  operator?: string;
  left?: ODataASTNode;
  right?: ODataASTNode;
  operand?: ODataASTNode;
  name?: string;
  arguments?: ODataASTNode[];
  value?: string | number | boolean | null;
}

/**
 * OData Filter Parser
 * Converts OData filter expressions to SQL Expression objects
 */
export class FilterParser {
  private tokens: ODataToken[] = [];
  private current = 0;
  private fieldColumnMap: Map<string, string>;

  /**
   * Creates a new OData filter parser
   * @param fieldColumnMap - Map of entity field names to database column names
   */
  constructor(fieldColumnMap: Map<string, string> = new Map()) {
    this.fieldColumnMap = fieldColumnMap;
  }

  /**
   * Parse an OData filter string into an Expression
   * @param filter - The OData filter string
   * @returns Expression object that can be used with SQL builders
   */
  parse(filter: string): Expression {
    if (!filter || filter.trim() === '') {
      return new Expression();
    }

    this.tokens = this.tokenize(filter);
    this.current = 0;

    const ast = this.parseOrExpression();
    return this.astToExpression(ast);
  }

  /**
   * Tokenize the OData filter string
   */
  private tokenize(filter: string): ODataToken[] {
    const tokens: ODataToken[] = [];
    let position = 0;

    while (position < filter.length) {
      // Skip whitespace
      if (/\s/.test(filter[position])) {
        position++;
        continue;
      }

      // String literals
      if (filter[position] === "'") {
        const start = position;
        position++; // Skip opening quote
        let value = '';

        while (position < filter.length && filter[position] !== "'") {
          if (filter[position] === '\\' && position + 1 < filter.length) {
            // Handle escaped characters
            position++;
            switch (filter[position]) {
              case 'n':
                value += '\n';
                break;
              case 't':
                value += '\t';
                break;
              case 'r':
                value += '\r';
                break;
              case '\\':
                value += '\\';
                break;
              case "'":
                value += "'";
                break;
              default:
                value += filter[position];
                break;
            }
          } else {
            value += filter[position];
          }
          position++;
        }

        if (position >= filter.length) {
          throw new ODataParseError('Unterminated string literal', start);
        }

        position++; // Skip closing quote
        tokens.push({ type: 'STRING', value, position: start });
        continue;
      }

      // Numbers (including negative numbers)
      if (/\d/.test(filter[position]) || (filter[position] === '-' && position + 1 < filter.length && /\d/.test(filter[position + 1]))) {
        const start = position;
        let value = '';

        // Handle negative sign
        if (filter[position] === '-') {
          value += filter[position];
          position++;
        }

        while (position < filter.length && /[\d.]/.test(filter[position])) {
          value += filter[position];
          position++;
        }

        tokens.push({ type: 'NUMBER', value, position: start });
        continue;
      }

      // Parentheses
      if (filter[position] === '(') {
        tokens.push({ type: 'LPAREN', value: '(', position });
        position++;
        continue;
      }

      if (filter[position] === ')') {
        tokens.push({ type: 'RPAREN', value: ')', position });
        position++;
        continue;
      }

      if (filter[position] === ',') {
        tokens.push({ type: 'COMMA', value: ',', position });
        position++;
        continue;
      }

      // Identifiers, operators, functions, keywords
      if (/[a-zA-Z_]/.test(filter[position])) {
        const start = position;
        let value = '';

        while (position < filter.length && /[a-zA-Z0-9_]/.test(filter[position])) {
          value += filter[position];
          position++;
        }

        // Determine token type
        const lowerValue = value.toLowerCase();

        if (['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'and', 'or', 'not'].includes(lowerValue)) {
          tokens.push({ type: 'OPERATOR', value: lowerValue, position: start });
        } else if (['true', 'false'].includes(lowerValue)) {
          tokens.push({ type: 'BOOLEAN', value: lowerValue, position: start });
        } else if (lowerValue === 'null') {
          tokens.push({ type: 'NULL', value: lowerValue, position: start });
        } else if (['contains', 'startswith', 'endswith', 'add', 'sub', 'mul', 'div', 'in'].includes(lowerValue)) {
          tokens.push({ type: 'FUNCTION', value: lowerValue, position: start });
        } else {
          tokens.push({ type: 'IDENTIFIER', value, position: start });
        }
        continue;
      }

      throw new ODataParseError(`Unexpected character '${filter[position]}'`, position);
    }

    return tokens;
  }

  private peek(): ODataToken | null {
    return this.current < this.tokens.length ? this.tokens[this.current] : null;
  }

  private advance(): ODataToken | null {
    const token = this.peek();
    this.current++;
    return token;
  }

  private expect(type: ODataToken['type'], value?: string): ODataToken {
    const token = this.advance();
    if (!token || token.type !== type || (value && token.value !== value)) {
      throw new ODataParseError(`Expected ${type}${value ? ` '${value}'` : ''} but got ${token ? `${token.type} '${token.value}'` : 'end of input'}`, token?.position);
    }
    return token;
  }

  /**
   * Parse OR expressions (lowest precedence)
   */
  private parseOrExpression(): ODataASTNode {
    let left = this.parseAndExpression();

    while (this.peek()?.type === 'OPERATOR' && this.peek()?.value === 'or') {
      const operator = this.advance();
      if (!operator) {
        throw new ODataParseError('Unexpected end of input while parsing OR expression');
      }
      const right = this.parseAndExpression();
      left = {
        type: 'BinaryExpression',
        operator: operator.value,
        left,
        right
      };
    }

    return left;
  }

  /**
   * Parse AND expressions
   */
  private parseAndExpression(): ODataASTNode {
    let left = this.parseNotExpression();

    while (this.peek()?.type === 'OPERATOR' && this.peek()?.value === 'and') {
      const operator = this.advance();
      if (!operator) {
        throw new ODataParseError('Unexpected end of input while parsing AND expression');
      }
      const right = this.parseNotExpression();
      left = {
        type: 'BinaryExpression',
        operator: operator.value,
        left,
        right
      };
    }

    return left;
  }

  /**
   * Parse NOT expressions
   */
  private parseNotExpression(): ODataASTNode {
    if (this.peek()?.type === 'OPERATOR' && this.peek()?.value === 'not') {
      const operator = this.advance();
      if (!operator) {
        throw new ODataParseError('Unexpected end of input while parsing NOT expression');
      }
      const operand = this.parseNotExpression();
      return {
        type: 'UnaryExpression',
        operator: operator.value,
        operand
      };
    }

    return this.parseComparisonExpression();
  }

  /**
   * Parse comparison expressions (eq, ne, gt, etc.)
   */
  private parseComparisonExpression(): ODataASTNode {
    let left = this.parseAdditiveExpression();

    const peeked = this.peek();
    if (peeked?.type === 'OPERATOR' && ['eq', 'ne', 'gt', 'ge', 'lt', 'le'].includes(peeked.value)) {
      const operator = this.advance();
      if (!operator) {
        throw new ODataParseError('Unexpected end of input while parsing comparison expression');
      }
      const right = this.parseAdditiveExpression();
      left = {
        type: 'BinaryExpression',
        operator: operator.value,
        left,
        right
      };
    }

    return left;
  }

  /**
   * Parse additive expressions (add, sub)
   */
  private parseAdditiveExpression(): ODataASTNode {
    let left = this.parseMultiplicativeExpression();

    let peeked = this.peek();
    while (peeked?.type === 'FUNCTION' && ['add', 'sub'].includes(peeked.value)) {
      const operator = this.advance();
      if (!operator) {
        throw new ODataParseError('Unexpected end of input while parsing additive expression');
      }
      this.expect('LPAREN');
      const right = this.parseMultiplicativeExpression();
      this.expect('RPAREN');

      left = {
        type: 'BinaryExpression',
        operator: operator.value,
        left,
        right
      };
      peeked = this.peek();
    }

    return left;
  }

  /**
   * Parse multiplicative expressions (mul, div)
   */
  private parseMultiplicativeExpression(): ODataASTNode {
    let left = this.parsePrimaryExpression();

    let peeked = this.peek();
    while (peeked?.type === 'FUNCTION' && ['mul', 'div'].includes(peeked.value)) {
      const operator = this.advance();
      if (!operator) {
        throw new ODataParseError('Unexpected end of input while parsing multiplicative expression');
      }
      this.expect('LPAREN');
      const right = this.parsePrimaryExpression();
      this.expect('RPAREN');

      left = {
        type: 'BinaryExpression',
        operator: operator.value,
        left,
        right
      };
      peeked = this.peek();
    }

    return left;
  }

  /**
   * Parse primary expressions (literals, identifiers, functions, parenthesized expressions)
   */
  private parsePrimaryExpression(): ODataASTNode {
    const token = this.peek();

    if (!token) {
      throw new ODataParseError('Unexpected end of input');
    }

    // Parenthesized expressions
    if (token.type === 'LPAREN') {
      this.advance(); // consume '('
      const expr = this.parseOrExpression();
      this.expect('RPAREN');
      return expr;
    }

    // Function calls
    if (token.type === 'FUNCTION') {
      return this.parseFunctionCall();
    }

    // Literals
    if (token.type === 'STRING') {
      this.advance();
      return { type: 'Literal', value: token.value };
    }

    if (token.type === 'NUMBER') {
      this.advance();
      const numValue = token.value.includes('.') ? parseFloat(token.value) : parseInt(token.value, 10);
      return { type: 'Literal', value: numValue };
    }

    if (token.type === 'BOOLEAN') {
      this.advance();
      return { type: 'Literal', value: token.value === 'true' };
    }

    if (token.type === 'NULL') {
      this.advance();
      return { type: 'Literal', value: null };
    }

    // Identifiers
    if (token.type === 'IDENTIFIER') {
      this.advance();
      return { type: 'Identifier', name: token.value };
    }

    throw new ODataParseError(`Unexpected token '${token.value}'`, token.position);
  }

  /**
   * Parse function calls
   */
  private parseFunctionCall(): ODataASTNode {
    const funcToken = this.expect('FUNCTION');
    this.expect('LPAREN');

    const args: ODataASTNode[] = [];

    // Handle functions with no arguments
    if (this.peek()?.type === 'RPAREN') {
      this.advance();
      return {
        type: 'FunctionCall',
        name: funcToken.value,
        arguments: args
      };
    }

    // Parse arguments
    do {
      args.push(this.parseOrExpression());

      if (this.peek()?.type === 'COMMA') {
        this.advance();
      } else {
        break;
      }
    } while (this.peek()?.type !== 'RPAREN');

    this.expect('RPAREN');

    return {
      type: 'FunctionCall',
      name: funcToken.value,
      arguments: args
    };
  }

  /**
   * Convert AST to Expression
   */
  private astToExpression(node: ODataASTNode): Expression {
    switch (node.type) {
      case 'BinaryExpression':
        return this.createBinaryExpression(node);

      case 'UnaryExpression':
        return this.createUnaryExpression(node);

      case 'FunctionCall':
        return this.createFunctionExpression(node);

      case 'Literal':
        return this.createLiteralExpression(node);

      case 'Identifier':
        return this.createIdentifierExpression(node);

      default:
        throw new ODataParseError(`Unknown AST node type: ${node.type || 'unknown'}`);
    }
  }

  private createBinaryExpression(node: ODataASTNode): Expression {
    if (!node.left || !node.right || !node.operator) {
      throw new ODataParseError('Invalid binary expression');
    }

    const left = this.astToExpression(node.left);
    const right = this.astToExpression(node.right);

    let operator: Operator;

    switch (node.operator) {
      case 'eq':
        operator = Operator.Equal;
        break;
      case 'ne':
        operator = Operator.NotEqual;
        break;
      case 'gt':
        operator = Operator.GreaterThan;
        break;
      case 'ge':
        operator = Operator.GreaterThanEqual;
        break;
      case 'lt':
        operator = Operator.LessThan;
        break;
      case 'le':
        operator = Operator.LessThanEqual;
        break;
      case 'and':
        operator = Operator.And;
        break;
      case 'or':
        operator = Operator.Or;
        break;
      case 'add':
        operator = Operator.Plus;
        break;
      case 'sub':
        operator = Operator.Minus;
        break;
      case 'mul':
        operator = Operator.Multiply;
        break;
      case 'div':
        operator = Operator.Devide;
        break;
      case 'mod': {
        // Since Modulo operator doesn't exist, we'll create a custom function expression
        // This could be translated to SQL MOD function by the database handler
        const modExpr = new Expression('MOD(?, ?)');
        modExpr.args = [];
        // We need to manually handle this case since there's no Modulo operator
        throw new ODataParseError('Modulo operator (mod) is not supported by the current SQL expression system');
      }
      default:
        throw new ODataParseError(`Unknown binary operator: ${node.operator}`);
    }

    return new Expression(null, operator, left, right);
  }

  private createUnaryExpression(node: ODataASTNode): Expression {
    if (!node.operand || !node.operator) {
      throw new ODataParseError('Invalid unary expression');
    }

    const operand = this.astToExpression(node.operand);

    let operator: Operator;

    switch (node.operator) {
      case 'not':
        operator = Operator.Not;
        break;
      default:
        throw new ODataParseError(`Unknown unary operator: ${node.operator}`);
    }

    return new Expression(null, operator, operand);
  }

  private createFunctionExpression(node: ODataASTNode): Expression {
    if (!node.name || !node.arguments) {
      throw new ODataParseError('Invalid function call');
    }

    const args = node.arguments.map(arg => this.astToExpression(arg));

    switch (node.name) {
      case 'contains': {
        if (args.length !== 2) {
          throw new ODataParseError('contains function requires exactly 2 arguments');
        }
        // contains(field, 'value') -> field LIKE '%value%'
        const containsValue = new Expression('?');
        containsValue.args = [`%${this.extractLiteralValue(node.arguments[1])}%`];
        return new Expression(null, Operator.Like, args[0], containsValue);
      }

      case 'startswith': {
        if (args.length !== 2) {
          throw new ODataParseError('startswith function requires exactly 2 arguments');
        }
        // startswith(field, 'value') -> field LIKE 'value%'
        const startsValue = new Expression('?');
        startsValue.args = [`${this.extractLiteralValue(node.arguments[1])}%`];
        return new Expression(null, Operator.Like, args[0], startsValue);
      }

      case 'endswith': {
        if (args.length !== 2) {
          throw new ODataParseError('endswith function requires exactly 2 arguments');
        }
        // endswith(field, 'value') -> field LIKE '%value'
        const endsValue = new Expression('?');
        endsValue.args = [`%${this.extractLiteralValue(node.arguments[1])}`];
        return new Expression(null, Operator.Like, args[0], endsValue);
      }

      case 'length':
        if (args.length !== 1) {
          throw new ODataParseError('length function requires exactly 1 argument');
        }
        // Since Length operator doesn't exist, throw an error for now
        // This could be extended in the future to support custom SQL functions
        throw new ODataParseError('Length function is not supported. Consider using a simpler filter or raw SQL query.');

      case 'year':
      case 'month':
      case 'day':
      case 'hour':
      case 'minute':
      case 'second':
        if (args.length !== 1) {
          throw new ODataParseError(`${node.name} function requires exactly 1 argument`);
        }
        // Since these date operators don't exist, throw an error for now
        // This could be extended in the future to support custom SQL functions
        throw new ODataParseError(`Date function '${node.name}' is not supported. Consider using a simpler filter or raw SQL query.`);

      case 'in':
        if (args.length < 2) {
          throw new ODataParseError('in function requires at least 2 arguments');
        }
        // in(field, value1, value2, ...) -> field IN (value1, value2, ...)
        return new Expression(null, Operator.In, args[0], ...args.slice(1));

      default:
        throw new ODataParseError(`Unknown function: ${node.name}`);
    }
  }

  private createLiteralExpression(node: ODataASTNode): Expression {
    const expr = new Expression('?');
    expr.args = [node.value];
    return expr;
  }

  private createIdentifierExpression(node: ODataASTNode): Expression {
    if (!node.name) {
      throw new ODataParseError('Invalid identifier');
    }

    // Map field name to column name if mapping exists
    const columnName = this.fieldColumnMap.get(node.name) || node.name;
    return new Expression(columnName);
  }

  private extractLiteralValue(node: ODataASTNode): string | number | boolean {
    if (node.type === 'Literal' && node.value !== null && node.value !== undefined) {
      return node.value;
    }
    throw new ODataParseError('Expected literal value');
  }
}

/**
 * Create a new OData filter parser with optional field-to-column mapping
 * @param fieldColumnMap - Map of entity field names to database column names
 * @returns New FilterParser instance
 */
export function createFilterParser(fieldColumnMap?: Map<string, string>): FilterParser {
  return new FilterParser(fieldColumnMap);
}

/**
 * Parse an OData filter string directly
 * @param filter - The OData filter string to parse
 * @param fieldColumnMap - Optional map of entity field names to database column names
 * @returns Expression object that can be used with SQL builders
 */
export function parseFilter(filter: string, fieldColumnMap?: Map<string, string>): Expression {
  const parser = new FilterParser(fieldColumnMap);
  return parser.parse(filter);
}

export default FilterParser;
