/**
 * GraphQL Query Parser - Types and Error Classes
 *
 * Defines tokens, AST nodes, result shapes, and introspection interfaces
 * used by the GraphQL query parser and introspection provider.
 */

// ---- Tokenizer ----

export type TokenType = 'LBRACE' | 'RBRACE' | 'LPAREN' | 'RPAREN' | 'LBRACKET' | 'RBRACKET' | 'COLON' | 'BANG' | 'SPREAD' | 'NAME' | 'STRING' | 'INT' | 'FLOAT' | 'BOOLEAN' | 'NULL' | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// ---- AST Value Nodes ----

export type Value =
  | { kind: 'StringValue'; value: string }
  | { kind: 'IntValue'; value: number }
  | { kind: 'FloatValue'; value: number }
  | { kind: 'BooleanValue'; value: boolean }
  | { kind: 'NullValue' }
  | { kind: 'ListValue'; values: Value[] }
  | { kind: 'ObjectValue'; fields: ObjectField[] }
  | { kind: 'EnumValue'; value: string };

export interface ObjectField {
  kind: 'ObjectField';
  name: string;
  value: Value;
}

export interface Argument {
  kind: 'Argument';
  name: string;
  value: Value;
}

export interface Field {
  kind: 'Field';
  name: string;
  alias?: string;
  arguments: Argument[];
  selectionSet?: SelectionSet;
}

export interface SelectionSet {
  kind: 'SelectionSet';
  selections: Field[];
}

export interface OperationDefinition {
  kind: 'OperationDefinition';
  operation: 'query' | 'mutation' | 'subscription' | 'shorthand';
  name?: string;
  selectionSet: SelectionSet;
}

export interface Document {
  kind: 'Document';
  definitions: OperationDefinition[];
}

// ---- Query Result Types ----

export type WhereCondition = Record<string, unknown>;

export interface OrderByClause {
  /** Entity field name */
  field: string;
  direction: 'asc' | 'desc';
}

export interface GraphQLQueryParams {
  /** The top-level field name (e.g., "employees") */
  operationName?: string;
  /** Selected scalar field names (empty = all fields) */
  fields: string[];
  /** Where filter conditions (Prisma-like nested object) */
  where?: WhereCondition;
  /** Order by clauses */
  orderBy?: OrderByClause[];
  /** Maximum number of results — maps to LIMIT */
  first?: number;
  /** Number of results to skip — maps to OFFSET */
  skip?: number;
}

export interface GraphQLQueryResult {
  success: boolean;
  params: GraphQLQueryParams;
  error?: string;
  originalQuery: string;
}

// ---- Introspection Types (GraphQL spec §4.4.1) ----

export type GraphQLTypeKind = 'SCALAR' | 'OBJECT' | 'INTERFACE' | 'UNION' | 'ENUM' | 'INPUT_OBJECT' | 'LIST' | 'NON_NULL';

export interface GraphQLTypeRef {
  kind: GraphQLTypeKind;
  name: string | null;
  ofType: GraphQLTypeRef | null;
}

export interface GraphQLInputValue {
  name: string;
  description: string | null;
  type: GraphQLTypeRef;
  defaultValue: string | null;
}

export interface GraphQLFieldDef {
  name: string;
  description: string | null;
  type: GraphQLTypeRef;
  args: GraphQLInputValue[];
  isDeprecated: boolean;
  deprecationReason: null;
}

export interface GraphQLTypeDef {
  kind: GraphQLTypeKind;
  name: string;
  description: string | null;
  fields: GraphQLFieldDef[] | null;
  inputFields: GraphQLInputValue[] | null;
  enumValues: null;
  interfaces: [];
  possibleTypes: null;
}

export interface GraphQLSchemaIntrospection {
  data: {
    __schema: {
      queryType: { name: string };
      mutationType: null;
      subscriptionType: null;
      types: GraphQLTypeDef[];
      directives: [];
    };
  };
}

export interface GraphQLTypeIntrospection {
  data: {
    __type: GraphQLTypeDef | null;
  };
}

// ---- Errors ----

export class GraphQLParseError extends Error {
  readonly position: number;

  constructor(message: string, position = 0) {
    super(`GraphQL Parse Error at position ${position}: ${message}`);
    this.name = 'GraphQLParseError';
    this.position = position;
  }
}

export class GraphQLIntrospectionError extends Error {
  constructor(message: string) {
    super(`GraphQL Introspection Error: ${message}`);
    this.name = 'GraphQLIntrospectionError';
  }
}
