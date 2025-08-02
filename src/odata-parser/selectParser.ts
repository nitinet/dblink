import { ODataSelectParseError } from './types.js';

/**
 * Token types for OData $select parsing
 */
enum TokenType {
  Field = 'FIELD',
  Comma = 'COMMA',
  Whitespace = 'WHITESPACE',
  EOF = 'EOF'
}

/**
 * Token interface
 */
interface Token {
  type: TokenType;
  value: string;
  position: number;
}

/**
 * Represents a selected field in OData $select
 */
interface SelectField {
  name: string;
  position: number;
}

/**
 * OData Select Parser Result
 */
interface SelectParseResult {
  /** Array of field names to select */
  fields: string[];
  /** Original query for debugging */
  originalQuery: string;
  /** Whether the query was successfully parsed */
  success: boolean;
  /** Error message if parsing failed */
  error?: string;
}

/**
 * OData Select Parser
 *
 * Parses OData $select query parameters into field arrays that can be used
 * with DBLink's .select() method.
 *
 * Supports:
 * - Simple field selection: "name,email,age"
 * - Whitespace handling: "name, email , age"
 * - Field validation and normalization
 *
 * @example
 * ```typescript
 * const parser = new SelectParser();
 *
 * // Simple field selection
 * const result = parser.parse("name,email,age");
 * // Returns: { fields: ["name", "email", "age"], success: true, ... }
 *
 * // Use with DBLink QuerySet
 * const query = dbSet.select(result.fields);
 * ```
 */
class SelectParser {
  private tokens: Token[] = [];
  private position = 0;

  /**
   * Parse an OData $select query into field array
   *
   * @param query - The OData $select query string (e.g., "name,email,age")
   * @returns SelectParseResult containing field array and parsing status
   */
  parse(query: string): SelectParseResult {
    if (!query || typeof query !== 'string') {
      return {
        fields: [],
        originalQuery: query || '',
        success: false,
        error: 'Query must be a non-empty string'
      };
    }

    // Reset parser state
    this.tokens = [];
    this.position = 0;

    try {
      // Tokenize the input
      this.tokenize(query.trim());

      // Parse tokens into fields
      const fields = this.parseFields();

      // Validate and normalize fields
      const normalizedFields = this.validateAndNormalizeFields(fields);

      return {
        fields: normalizedFields,
        originalQuery: query,
        success: true
      };
    } catch (error) {
      return {
        fields: [],
        originalQuery: query,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  }

  /**
   * Tokenize the input query string
   */
  private tokenize(query: string): void {
    let position = 0;

    while (position < query.length) {
      const char = query[position];

      if (char === ',') {
        this.tokens.push({
          type: TokenType.Comma,
          value: char,
          position
        });
        position++;
      } else if (/\s/.test(char)) {
        // Skip whitespace but track it for error reporting
        let whitespace = '';
        while (position < query.length && /\s/.test(query[position])) {
          whitespace += query[position];
          position++;
        }
        if (whitespace.length > 0) {
          this.tokens.push({
            type: TokenType.Whitespace,
            value: whitespace,
            position: position - whitespace.length
          });
        }
      } else {
        // Parse field name
        let fieldName = '';
        const startPos = position;

        while (position < query.length && !','.includes(query[position]) && !/\s/.test(query[position])) {
          fieldName += query[position];
          position++;
        }

        if (fieldName.length > 0) {
          this.tokens.push({
            type: TokenType.Field,
            value: fieldName,
            position: startPos
          });
        }
      }
    }

    // Add EOF token
    this.tokens.push({
      type: TokenType.EOF,
      value: '',
      position: query.length
    });
  }

  /**
   * Parse tokens into field array
   */
  private parseFields(): SelectField[] {
    const fields: SelectField[] = [];

    while (!this.isAtEnd()) {
      // Skip whitespace
      this.skipWhitespace();

      if (this.isAtEnd()) {
        break;
      }

      // Expect field name
      if (this.peek().type !== TokenType.Field) {
        throw new ODataSelectParseError(`Expected field name at position ${this.peek().position}, found ${this.peek().type}`, this.peek().position);
      }

      const fieldToken = this.advance();
      fields.push({
        name: fieldToken.value,
        position: fieldToken.position
      });

      // Skip whitespace
      this.skipWhitespace();

      if (this.isAtEnd()) {
        break;
      }

      // Check for comma or end
      if (this.peek().type === TokenType.Comma) {
        this.advance(); // consume comma

        // Skip whitespace after comma
        this.skipWhitespace();

        // If we're at end after comma, that's an error
        if (this.isAtEnd()) {
          throw new ODataSelectParseError('Unexpected end of query after comma');
        }
      } else if (this.peek().type !== TokenType.EOF) {
        throw new ODataSelectParseError(`Expected comma or end of query at position ${this.peek().position}, found ${this.peek().type}`, this.peek().position);
      }
    }

    return fields;
  }

  /**
   * Skip whitespace tokens
   */
  private skipWhitespace(): void {
    while (!this.isAtEnd() && this.peek().type === TokenType.Whitespace) {
      this.advance();
    }
  }

  /**
   * Check if we're at the end of tokens
   */
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  /**
   * Get current token without advancing
   */
  private peek(): Token {
    return this.tokens[this.position] || { type: TokenType.EOF, value: '', position: -1 };
  }

  /**
   * Get current token and advance position
   */
  private advance(): Token {
    if (!this.isAtEnd()) {
      this.position++;
    }
    return this.tokens[this.position - 1] || { type: TokenType.EOF, value: '', position: -1 };
  }

  /**
   * Validate and normalize field names
   */
  private validateAndNormalizeFields(fields: SelectField[]): string[] {
    if (fields.length === 0) {
      throw new ODataSelectParseError('No fields specified in select query');
    }

    const normalizedFields: string[] = [];
    const seenFields = new Set<string>();

    for (const field of fields) {
      // Validate field name
      if (!this.isValidFieldName(field.name)) {
        throw new ODataSelectParseError(`Invalid field name '${field.name}' at position ${field.position}`, field.position);
      }

      // Check for duplicates
      const normalizedName = field.name.trim();
      if (seenFields.has(normalizedName)) {
        throw new ODataSelectParseError(`Duplicate field '${normalizedName}' at position ${field.position}`, field.position);
      }

      seenFields.add(normalizedName);
      normalizedFields.push(normalizedName);
    }

    return normalizedFields;
  }

  /**
   * Validate field name format
   */
  private isValidFieldName(name: string): boolean {
    if (!name || name.trim().length === 0) {
      return false;
    }

    // Basic field name validation: alphanumeric, underscore, and dots for nested properties
    const fieldNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;
    return fieldNameRegex.test(name.trim());
  }

  /**
   * Helper method to parse and create field array for DBLink QuerySet.select()
   *
   * @param query - OData $select query
   * @returns Array of field names ready for use with DBLink
   * @throws Error if parsing fails
   */
  static parseToFieldArray(query: string): string[] {
    const parser = new SelectParser();
    const result = parser.parse(query);

    if (!result.success) {
      throw new ODataSelectParseError(`OData select parsing failed: ${result.error}`);
    }

    return result.fields;
  }

  /**
   * Helper method to validate if a select query is valid
   *
   * @param query - OData $select query to validate
   * @returns true if valid, false otherwise
   */
  static isValidSelectQuery(query: string): boolean {
    try {
      const parser = new SelectParser();
      const result = parser.parse(query);
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Apply select fields to a DBLink QuerySet or TableSet
   *
   * This helper integrates the parsed OData select with DBLink's select functionality.
   * It validates that requested fields exist in the entity and applies the selection.
   *
   * @param querySet - DBLink QuerySet or TableSet to apply selection to
   * @param odataSelect - OData $select query string
   * @param availableFields - Optional array of valid field names for validation
   * @returns The QuerySet with selection applied
   * @throws Error if parsing fails or fields are invalid
   *
   * @example
   * ```typescript
   * // Apply OData select to a QuerySet
   * const selectedQuery = SelectParser.applySelect(
   *   context.users,
   *   "id,firstName,lastName",
   *   ["id", "firstName", "lastName", "email", "createdAt"]
   * );
   *
   * const users = await selectedQuery.list();
   * ```
   */
  static applySelect<T extends { select(fields: string[]): R }, R = unknown>(querySet: T, odataSelect: string, availableFields?: string[]): R {
    // Parse the OData select query
    const fields = this.parseToFieldArray(odataSelect);

    // Validate against available fields if provided
    if (availableFields) {
      const invalidFields = fields.filter(field => !availableFields.includes(field));
      if (invalidFields.length > 0) {
        throw new ODataSelectParseError(`Invalid field(s) in select: ${invalidFields.join(', ')}. Available fields: ${availableFields.join(', ')}`);
      }
    }

    // Apply selection to the QuerySet
    return querySet.select(fields);
  }
}

export default SelectParser;
export { SelectParseResult, SelectField };
