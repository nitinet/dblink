import Expression from 'dblink-core/src/sql/Expression.js';
import Operator from 'dblink-core/src/sql/types/Operator.js';
import {
  Token,
  TokenType,
  Document,
  OperationDefinition,
  SelectionSet,
  Field,
  Argument,
  Value,
  ObjectField,
  GraphQLQueryResult,
  GraphQLQueryParams,
  WhereCondition,
  OrderByClause,
  GraphQLParseError
} from './types.js';

/**
 * GraphQL Query Parser
 *
 * Lightweight recursive-descent parser for GraphQL query documents.
 * Parses queries and extracts parameters that map directly onto QuerySet operations:
 *
 * | GraphQL argument | QuerySet method    |
 * |------------------|--------------------|
 * | field selection  | .select(fields)    |
 * | where: { ... }   | .where(() => expr) |
 * | orderBy: { ... } | .orderBy(...)      |
 * | first: N         | .limit(N, skip)    |
 * | skip: N          | .limit(first, N)   |
 *
 * Where conditions follow the same nested object format as the Prisma filter parser:
 * operators: eq, ne, gt, gte, lt, lte, in, notIn, contains, startsWith, endsWith, AND, OR, NOT
 *
 * @example
 * ```typescript
 * const parser = new QueryParser(fieldColumnMap);
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
 *       email
 *     }
 *   }
 * `);
 *
 * if (result.success) {
 *   let qs = employeeQuerySet;
 *   if (result.params.fields.length > 0) qs = qs.select(result.params.fields);
 *   if (result.params.where) {
 *     const expr = parser.buildWhereExpression(result.params.where);
 *     qs = qs.where(() => expr);
 *   }
 *   if (result.params.first !== undefined) qs = qs.limit(result.params.first, result.params.skip);
 *   const data = await qs.list();
 * }
 * ```
 */
export class QueryParser {
  private tokens: Token[] = [];
  private current = 0;
  private readonly fieldColumnMap: Map<string, string>;

  /**
   * @param fieldColumnMap  Map of entity field names → database column names.
   *   Used when building WHERE expressions so parameterised queries reference
   *   the correct column. Falls back to the field name when not found.
   */
  constructor(fieldColumnMap: Map<string, string> = new Map()) {
    this.fieldColumnMap = fieldColumnMap;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Parse a GraphQL query string and return structured query parameters.
   *
   * Accepts shorthand (`{ employees { id } }`), named queries
   * (`query ListEmployees { ... }`), and queries with arguments.
   */
  parse(query: string): GraphQLQueryResult {
    const emptyParams: GraphQLQueryParams = { fields: [] };

    if (!query || query.trim() === '') {
      return { success: false, params: emptyParams, error: 'Empty query', originalQuery: query ?? '' };
    }

    try {
      this.tokens = this.tokenize(query);
      this.current = 0;
      const doc = this.parseDocument();
      const params = this.extractParams(doc);
      return { success: true, params, originalQuery: query };
    } catch (e) {
      return { success: false, params: emptyParams, error: e instanceof Error ? e.message : String(e), originalQuery: query };
    }
  }

  /**
   * Convert a parsed `where` condition object into a SQL Expression tree.
   *
   * The condition object uses the same format as the Prisma filter parser:
   * - `{ field: { eq: value } }`
   * - `{ AND: [{ field1: { gt: 0 } }, { field2: "active" }] }`
   * - `{ OR: [...] }`, `{ NOT: { ... } }`
   */
  buildWhereExpression(where: WhereCondition): Expression {
    const expressions: Expression[] = [];

    for (const [key, value] of Object.entries(where)) {
      if (key === 'AND' && Array.isArray(value)) {
        const subs = (value as WhereCondition[]).map(v => this.buildWhereExpression(v)).filter(e => e.exps.length > 0);
        if (subs.length > 0) expressions.push(new Expression(null, Operator.And, ...subs));
      } else if (key === 'OR' && Array.isArray(value)) {
        const subs = (value as WhereCondition[]).map(v => this.buildWhereExpression(v)).filter(e => e.exps.length > 0);
        if (subs.length > 0) expressions.push(new Expression(null, Operator.Or, ...subs));
      } else if (key === 'NOT') {
        const sub = this.buildWhereExpression(value as WhereCondition);
        if (sub.exps.length > 0) expressions.push(new Expression(null, Operator.Not, sub));
      } else {
        const colName = this.fieldColumnMap.get(key) ?? key;
        const expr = this.buildFieldExpression(colName, value);
        if (expr.exps.length > 0) expressions.push(expr);
      }
    }

    if (expressions.length === 0) return new Expression();
    if (expressions.length === 1) return expressions[0];
    return new Expression(null, Operator.And, ...expressions);
  }

  // ---------------------------------------------------------------------------
  // Tokenizer
  // ---------------------------------------------------------------------------

  private tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let pos = 0;

    while (pos < input.length) {
      const ch = input[pos];

      // Whitespace and insignificant commas
      if (/[\s,]/.test(ch)) {
        pos++;
        continue;
      }

      // Line comments
      if (ch === '#') {
        while (pos < input.length && input[pos] !== '\n') pos++;
        continue;
      }

      // Punctuation
      if (ch === '{') {
        tokens.push({ type: 'LBRACE', value: '{', position: pos++ });
        continue;
      }
      if (ch === '}') {
        tokens.push({ type: 'RBRACE', value: '}', position: pos++ });
        continue;
      }
      if (ch === '(') {
        tokens.push({ type: 'LPAREN', value: '(', position: pos++ });
        continue;
      }
      if (ch === ')') {
        tokens.push({ type: 'RPAREN', value: ')', position: pos++ });
        continue;
      }
      if (ch === '[') {
        tokens.push({ type: 'LBRACKET', value: '[', position: pos++ });
        continue;
      }
      if (ch === ']') {
        tokens.push({ type: 'RBRACKET', value: ']', position: pos++ });
        continue;
      }
      if (ch === ':') {
        tokens.push({ type: 'COLON', value: ':', position: pos++ });
        continue;
      }
      if (ch === '!') {
        tokens.push({ type: 'BANG', value: '!', position: pos++ });
        continue;
      }

      // Spread operator (...)
      if (input.startsWith('...', pos)) {
        tokens.push({ type: 'SPREAD', value: '...', position: pos });
        pos += 3;
        continue;
      }

      // String literal — double-quoted or triple-quoted block
      if (ch === '"') {
        if (input.startsWith('"""', pos)) {
          pos += 3;
          const start = pos;
          while (pos < input.length && !input.startsWith('"""', pos)) pos++;
          tokens.push({ type: 'STRING', value: input.slice(start, pos), position: start });
          pos += 3;
        } else {
          pos++;
          let str = '';
          while (pos < input.length && input[pos] !== '"') {
            if (input[pos] === '\\') {
              pos++;
              const esc = input[pos];
              if (esc === 'n') str += '\n';
              else if (esc === 't') str += '\t';
              else if (esc === 'r') str += '\r';
              else str += esc;
            } else {
              str += input[pos];
            }
            pos++;
          }
          if (pos >= input.length) throw new GraphQLParseError('Unterminated string literal', pos);
          tokens.push({ type: 'STRING', value: str, position: pos });
          pos++; // closing "
        }
        continue;
      }

      // Number
      if (/[0-9\-]/.test(ch) && (ch !== '-' || /[0-9]/.test(input[pos + 1] ?? ''))) {
        const start = pos;
        let isFloat = false;
        if (ch === '-') pos++;
        while (pos < input.length && /[0-9]/.test(input[pos])) pos++;
        if (pos < input.length && input[pos] === '.') {
          isFloat = true;
          pos++;
          while (pos < input.length && /[0-9]/.test(input[pos])) pos++;
        }
        if (pos < input.length && /[eE]/.test(input[pos])) {
          isFloat = true;
          pos++;
          if (pos < input.length && /[+\-]/.test(input[pos])) pos++;
          while (pos < input.length && /[0-9]/.test(input[pos])) pos++;
        }
        tokens.push({ type: isFloat ? 'FLOAT' : 'INT', value: input.slice(start, pos), position: start });
        continue;
      }

      // Identifier / keyword
      if (/[a-zA-Z_]/.test(ch)) {
        const start = pos;
        while (pos < input.length && /[a-zA-Z0-9_]/.test(input[pos])) pos++;
        const name = input.slice(start, pos);
        if (name === 'true' || name === 'false') {
          tokens.push({ type: 'BOOLEAN', value: name, position: start });
        } else if (name === 'null') {
          tokens.push({ type: 'NULL', value: 'null', position: start });
        } else {
          tokens.push({ type: 'NAME', value: name, position: start });
        }
        continue;
      }

      throw new GraphQLParseError(`Unexpected character: "${ch}"`, pos);
    }

    tokens.push({ type: 'EOF', value: '', position: pos });
    return tokens;
  }

  // ---------------------------------------------------------------------------
  // Parser helpers
  // ---------------------------------------------------------------------------

  private peek(): Token {
    return this.tokens[this.current];
  }

  private advance(): Token {
    const t = this.tokens[this.current];
    if (t.type !== 'EOF') this.current++;
    return t;
  }

  private expect(type: TokenType): Token {
    const t = this.peek();
    if (t.type !== type) {
      throw new GraphQLParseError(`Expected ${type} but got ${t.type} ("${t.value}")`, t.position);
    }
    return this.advance();
  }

  private skipBalanced(open: TokenType, close: TokenType): void {
    let depth = 0;
    while (this.peek().type !== 'EOF') {
      const t = this.advance();
      if (t.type === open) depth++;
      else if (t.type === close) {
        depth--;
        if (depth === 0) break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Recursive-descent AST parser
  // ---------------------------------------------------------------------------

  private parseDocument(): Document {
    const definitions: OperationDefinition[] = [];
    while (this.peek().type !== 'EOF') definitions.push(this.parseDefinition());
    return { kind: 'Document', definitions };
  }

  private parseDefinition(): OperationDefinition {
    const t = this.peek();

    // Shorthand: { ... }
    if (t.type === 'LBRACE') {
      return { kind: 'OperationDefinition', operation: 'shorthand', selectionSet: this.parseSelectionSet() };
    }

    // Typed operation: query / mutation / subscription
    if (t.type === 'NAME' && (t.value === 'query' || t.value === 'mutation' || t.value === 'subscription')) {
      const operation = this.advance().value as 'query' | 'mutation' | 'subscription';
      let name: string | undefined;
      if (this.peek().type === 'NAME') name = this.advance().value;
      if (this.peek().type === 'LPAREN') this.skipBalanced('LPAREN', 'RPAREN'); // variable defs
      return { kind: 'OperationDefinition', operation, name, selectionSet: this.parseSelectionSet() };
    }

    throw new GraphQLParseError(`Unexpected token: "${t.value}"`, t.position);
  }

  private parseSelectionSet(): SelectionSet {
    this.expect('LBRACE');
    const selections: Field[] = [];

    while (this.peek().type !== 'RBRACE' && this.peek().type !== 'EOF') {
      // Skip inline fragments and named fragments
      if (this.peek().type === 'SPREAD') {
        this.advance();
        if (this.peek().type === 'NAME' && this.peek().value === 'on') {
          this.advance(); // 'on'
          this.advance(); // type name
        } else if (this.peek().type === 'NAME') {
          this.advance(); // fragment name
        }
        if (this.peek().type === 'LBRACE') this.skipBalanced('LBRACE', 'RBRACE');
        continue;
      }
      selections.push(this.parseField());
    }

    this.expect('RBRACE');
    return { kind: 'SelectionSet', selections };
  }

  private parseField(): Field {
    const nameOrAlias = this.expect('NAME').value;
    let name = nameOrAlias;
    let alias: string | undefined;

    if (this.peek().type === 'COLON') {
      this.advance();
      alias = nameOrAlias;
      name = this.expect('NAME').value;
    }

    const args: Argument[] = [];
    if (this.peek().type === 'LPAREN') {
      this.advance();
      while (this.peek().type !== 'RPAREN' && this.peek().type !== 'EOF') args.push(this.parseArgument());
      this.expect('RPAREN');
    }

    let selectionSet: SelectionSet | undefined;
    if (this.peek().type === 'LBRACE') selectionSet = this.parseSelectionSet();

    return { kind: 'Field', name, alias, arguments: args, selectionSet };
  }

  private parseArgument(): Argument {
    const name = this.expect('NAME').value;
    this.expect('COLON');
    return { kind: 'Argument', name, value: this.parseValue() };
  }

  private parseValue(): Value {
    const t = this.peek();

    switch (t.type) {
      case 'STRING': {
        this.advance();
        return { kind: 'StringValue', value: t.value };
      }
      case 'INT': {
        this.advance();
        return { kind: 'IntValue', value: parseInt(t.value, 10) };
      }
      case 'FLOAT': {
        this.advance();
        return { kind: 'FloatValue', value: parseFloat(t.value) };
      }
      case 'BOOLEAN': {
        this.advance();
        return { kind: 'BooleanValue', value: t.value === 'true' };
      }
      case 'NULL': {
        this.advance();
        return { kind: 'NullValue' };
      }
      case 'NAME': {
        this.advance();
        return { kind: 'EnumValue', value: t.value };
      }

      case 'LBRACKET': {
        this.advance();
        const values: Value[] = [];
        while (this.peek().type !== 'RBRACKET' && this.peek().type !== 'EOF') values.push(this.parseValue());
        this.expect('RBRACKET');
        return { kind: 'ListValue', values };
      }

      case 'LBRACE': {
        this.advance();
        const fields: ObjectField[] = [];
        while (this.peek().type !== 'RBRACE' && this.peek().type !== 'EOF') {
          const fname = this.expect('NAME').value;
          this.expect('COLON');
          fields.push({ kind: 'ObjectField', name: fname, value: this.parseValue() });
        }
        this.expect('RBRACE');
        return { kind: 'ObjectValue', fields };
      }

      default:
        throw new GraphQLParseError(`Unexpected value token: ${t.type} ("${t.value}")`, t.position);
    }
  }

  // ---------------------------------------------------------------------------
  // Params extraction
  // ---------------------------------------------------------------------------

  private extractParams(doc: Document): GraphQLQueryParams {
    const def = doc.definitions[0];
    if (!def || def.selectionSet.selections.length === 0) return { fields: [] };

    const entityField = def.selectionSet.selections[0];
    const params: GraphQLQueryParams = { fields: [], operationName: entityField.name };

    for (const arg of entityField.arguments) {
      if (arg.name === 'where' && arg.value.kind === 'ObjectValue') {
        params.where = this.valueToJS(arg.value) as WhereCondition;
      } else if (arg.name === 'orderBy') {
        params.orderBy = this.extractOrderBy(arg.value);
      } else if (arg.name === 'first' && arg.value.kind === 'IntValue') {
        params.first = arg.value.value;
      } else if (arg.name === 'skip' && arg.value.kind === 'IntValue') {
        params.skip = arg.value.value;
      }
    }

    if (entityField.selectionSet) {
      // Only scalar fields (no sub-selection = no nested objects)
      params.fields = entityField.selectionSet.selections.filter(f => !f.selectionSet).map(f => f.alias ?? f.name);
    }

    return params;
  }

  private valueToJS(value: Value): unknown {
    switch (value.kind) {
      case 'StringValue':
        return value.value;
      case 'IntValue':
        return value.value;
      case 'FloatValue':
        return value.value;
      case 'BooleanValue':
        return value.value;
      case 'NullValue':
        return null;
      case 'EnumValue':
        return value.value;
      case 'ListValue':
        return value.values.map(v => this.valueToJS(v));
      case 'ObjectValue': {
        const obj: Record<string, unknown> = {};
        for (const f of value.fields) obj[f.name] = this.valueToJS(f.value);
        return obj;
      }
    }
  }

  private extractOrderBy(value: Value): OrderByClause[] {
    if (value.kind === 'ObjectValue') {
      return value.fields.map(f => ({
        field: f.name,
        direction: this.valueToJS(f.value) === 'desc' || this.valueToJS(f.value) === 'DESC' ? 'desc' : 'asc'
      }));
    }
    if (value.kind === 'ListValue') {
      return value.values.flatMap(v => this.extractOrderBy(v));
    }
    return [];
  }

  // ---------------------------------------------------------------------------
  // WHERE expression builder
  // ---------------------------------------------------------------------------

  private buildFieldExpression(colName: string, condition: unknown): Expression {
    const colExpr = new Expression(colName);

    if (condition === null || condition === undefined) {
      return new Expression(null, Operator.IsNull, colExpr);
    }

    if (typeof condition !== 'object' || Array.isArray(condition)) {
      // Shorthand equality: { field: value }
      const argExpr = new Expression('?');
      argExpr.args.push(condition);
      return new Expression(null, Operator.Equal, colExpr, argExpr);
    }

    const cond = condition as Record<string, unknown>;
    const expressions: Expression[] = [];

    for (const [op, val] of Object.entries(cond)) {
      const expr = this.buildOperatorExpression(colExpr, op, val);
      if (expr.exps.length > 0) expressions.push(expr);
    }

    if (expressions.length === 0) return new Expression();
    if (expressions.length === 1) return expressions[0];
    return new Expression(null, Operator.And, ...expressions);
  }

  private buildOperatorExpression(colExpr: Expression, op: string, val: unknown): Expression {
    const arg = (): Expression => {
      const e = new Expression('?');
      e.args.push(val);
      return e;
    };

    switch (op) {
      case 'eq':
      case 'equals':
        return val === null ? new Expression(null, Operator.IsNull, colExpr) : new Expression(null, Operator.Equal, colExpr, arg());

      case 'ne':
      case 'not':
        return val === null ? new Expression(null, Operator.IsNotNull, colExpr) : new Expression(null, Operator.NotEqual, colExpr, arg());

      case 'gt':
        return new Expression(null, Operator.GreaterThan, colExpr, arg());
      case 'gte':
      case 'ge':
        return new Expression(null, Operator.GreaterThanEqual, colExpr, arg());
      case 'lt':
        return new Expression(null, Operator.LessThan, colExpr, arg());
      case 'lte':
      case 'le':
        return new Expression(null, Operator.LessThanEqual, colExpr, arg());

      case 'in': {
        if (!Array.isArray(val)) return new Expression();
        const inExpr = new Expression('?');
        inExpr.args.push(...(val as unknown[]));
        return new Expression(null, Operator.In, colExpr, inExpr);
      }

      case 'notIn': {
        if (!Array.isArray(val)) return new Expression();
        const inExpr2 = new Expression('?');
        inExpr2.args.push(...(val as unknown[]));
        return new Expression(null, Operator.Not, new Expression(null, Operator.In, colExpr, inExpr2));
      }

      case 'contains': {
        const likeExpr = new Expression('?');
        likeExpr.args.push(`%${val}%`);
        return new Expression(null, Operator.Like, colExpr, likeExpr);
      }

      case 'startsWith': {
        const swExpr = new Expression('?');
        swExpr.args.push(`${val}%`);
        return new Expression(null, Operator.Like, colExpr, swExpr);
      }

      case 'endsWith': {
        const ewExpr = new Expression('?');
        ewExpr.args.push(`%${val}`);
        return new Expression(null, Operator.Like, colExpr, ewExpr);
      }

      default:
        return new Expression();
    }
  }
}

export default QueryParser;
