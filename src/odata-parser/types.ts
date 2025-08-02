/**
 * Common types and interfaces for OData parsers
 */

/**
 * Common token types used across OData parsers
 */
export enum CommonTokenType {
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',
  OPERATOR = 'OPERATOR',
  FUNCTION = 'FUNCTION',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  COMMA = 'COMMA',
  WHITESPACE = 'WHITESPACE',
  EOF = 'EOF'
}

/**
 * Direction types for ordering
 */
export enum Direction {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Base token interface used by all OData parsers
 */
export interface BaseToken {
  type: string;
  value: string;
  position: number;
}

/**
 * Generic token interface with specific type
 */
export interface Token<T extends string = string> extends BaseToken {
  type: T;
}

/**
 * Common AST node types for OData expressions
 */
export interface BaseASTNode {
  type: string;
}

/**
 * Binary expression AST node (for filter expressions)
 */
export interface BinaryExpressionNode extends BaseASTNode {
  type: 'BinaryExpression';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

/**
 * Unary expression AST node (for filter expressions)
 */
export interface UnaryExpressionNode extends BaseASTNode {
  type: 'UnaryExpression';
  operator: string;
  operand: ASTNode;
}

/**
 * Function call AST node (for filter expressions)
 */
export interface FunctionCallNode extends BaseASTNode {
  type: 'FunctionCall';
  name: string;
  arguments: ASTNode[];
}

/**
 * Literal value AST node
 */
export interface LiteralNode extends BaseASTNode {
  type: 'Literal';
  value: string | number | boolean | null;
}

/**
 * Identifier AST node
 */
export interface IdentifierNode extends BaseASTNode {
  type: 'Identifier';
  name: string;
}

/**
 * Union type for all AST nodes
 */
export type ASTNode = BinaryExpressionNode | UnaryExpressionNode | FunctionCallNode | LiteralNode | IdentifierNode;

/**
 * Base parse result interface
 */
export interface BaseParseResult<T = unknown> {
  success: boolean;
  error?: string;
  originalQuery: string;
  result?: T;
}

/**
 * Base exception class for OData parsing errors
 */
export class ODataParseError extends Error {
  public readonly position?: number;
  public readonly parameter?: string;

  constructor(message: string, options?: { position?: number; parameter?: string }) {
    const fullMessage = options?.position !== undefined ? `${message} at position ${options.position}` : options?.parameter ? `${message} for parameter '${options.parameter}'` : message;

    super(fullMessage);
    this.name = 'ODataParseError';
    this.position = options?.position;
    this.parameter = options?.parameter;
  }
}

/**
 * OData Filter parsing error
 */
export class ODataFilterParseError extends ODataParseError {
  constructor(message: string, position?: number) {
    super(message, { position });
    this.name = 'ODataFilterParseError';
  }
}

/**
 * OData OrderBy parsing error
 */
export class ODataOrderByParseError extends ODataParseError {
  constructor(message: string, position?: number) {
    super(message, { position });
    this.name = 'ODataOrderByParseError';
  }
}

/**
 * OData Select parsing error
 */
export class ODataSelectParseError extends ODataParseError {
  constructor(message: string, position?: number) {
    super(message, { position });
    this.name = 'ODataSelectParseError';
  }
}

/**
 * OData Top/Skip parsing error
 */
export class ODataTopSkipParseError extends ODataParseError {
  constructor(message: string, parameter?: string) {
    super(message, { parameter });
    this.name = 'ODataTopSkipParseError';
  }
}

/**
 * Common utility functions for OData parsing
 */
export const ODataParseUtils = {
  /**
   * Check if a character is alphabetic
   */
  isAlpha(char: string): boolean {
    return /[a-zA-Z]/.test(char);
  },

  /**
   * Check if a character is alphanumeric
   */
  isAlphaNumeric(char: string): boolean {
    return /[a-zA-Z0-9]/.test(char);
  },

  /**
   * Check if a character is numeric
   */
  isNumeric(char: string): boolean {
    return /[0-9]/.test(char);
  },

  /**
   * Check if a character is whitespace
   */
  isWhitespace(char: string): boolean {
    return /\s/.test(char);
  },

  /**
   * Check if a character is a valid identifier character
   */
  isIdentifierChar(char: string): boolean {
    return /[a-zA-Z0-9_.]/.test(char);
  },

  /**
   * Check if a string is a valid identifier
   */
  isValidIdentifier(str: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_.]*$/.test(str);
  },

  /**
   * Trim whitespace from both ends of a string
   */
  trim(str: string): string {
    return str.trim();
  },

  /**
   * Convert string to number with validation
   */
  parseNumber(str: string): number {
    const num = Number(str);
    if (isNaN(num)) {
      throw new ODataParseError(`Invalid number: ${str}`);
    }
    return num;
  },

  /**
   * Parse boolean value
   */
  parseBoolean(str: string): boolean {
    const lower = str.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    throw new ODataParseError(`Invalid boolean value: ${str}`);
  },

  /**
   * Escape string for SQL-like usage
   */
  escapeString(str: string): string {
    return str.replace(/'/g, "''");
  },

  /**
   * Unescape string from OData format
   */
  unescapeString(str: string): string {
    return str.replace(/''/g, "'");
  }
};

/**
 * Common tokenizer base class
 */
export abstract class BaseTokenizer<T extends BaseToken = BaseToken> {
  protected input: string;
  protected position: number;
  protected length: number;

  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.length = input.length;
  }

  /**
   * Get current character
   */
  protected current(): string {
    return this.position < this.length ? this.input[this.position] : '';
  }

  /**
   * Peek at next character without advancing
   */
  protected peek(offset: number = 1): string {
    const pos = this.position + offset;
    return pos < this.length ? this.input[pos] : '';
  }

  /**
   * Advance position and return current character
   */
  protected advance(): string {
    const char = this.current();
    this.position++;
    return char;
  }

  /**
   * Skip whitespace characters
   */
  protected skipWhitespace(): void {
    while (this.position < this.length && ODataParseUtils.isWhitespace(this.current())) {
      this.position++;
    }
  }

  /**
   * Check if we're at the end of input
   */
  protected isAtEnd(): boolean {
    return this.position >= this.length;
  }

  /**
   * Abstract method to tokenize the input
   */
  abstract tokenize(): T[];

  /**
   * Create a token at the current position
   */
  protected createToken(type: string, value: string, startPosition?: number): T {
    return {
      type,
      value,
      position: startPosition ?? this.position
    } as T;
  }
}
