import { beforeEach, describe, expect, it } from 'vitest';
import { QueryParser } from '../src/parsers/graphql/queryParser.js';
import { IntrospectionProvider } from '../src/parsers/graphql/introspection.js';
import * as decorators from '../src/decorators/index.js';
import 'reflect-metadata';

// ---- Minimal test entity ----

@decorators.Table('employees')
class TestEmployee {
  @decorators.Id
  @decorators.Column()
  id!: number;

  @decorators.Column('first_name')
  firstName!: string;

  @decorators.Column('last_name')
  lastName!: string;

  @decorators.Column()
  email!: string;

  @decorators.Column()
  age!: number;
}

// ---------------------------------------------------------------------------
// QueryParser tests
// ---------------------------------------------------------------------------

describe('GraphQL QueryParser', () => {
  const fieldColumnMap = new Map([
    ['firstName', 'first_name'],
    ['lastName', 'last_name'],
    ['email', 'email'],
    ['age', 'age'],
    ['id', 'id']
  ]);

  let parser: QueryParser;
  beforeEach(() => {
    parser = new QueryParser(fieldColumnMap);
  });

  // --- parse() ---

  describe('parse()', () => {
    it('returns success:false for empty query', () => {
      expect(parser.parse('').success).toBe(false);
      expect(parser.parse('  ').success).toBe(false);
    });

    it('parses a shorthand query', () => {
      const result = parser.parse('{ employees { id firstName } }');
      expect(result.success).toBe(true);
      expect(result.params.operationName).toBe('employees');
      expect(result.params.fields).toEqual(['id', 'firstName']);
    });

    it('parses a named query', () => {
      const result = parser.parse('query ListEmployees { employees { id email } }');
      expect(result.success).toBe(true);
      expect(result.params.fields).toEqual(['id', 'email']);
    });

    it('parses first and skip arguments', () => {
      const result = parser.parse('{ employees(first: 10, skip: 20) { id } }');
      expect(result.success).toBe(true);
      expect(result.params.first).toBe(10);
      expect(result.params.skip).toBe(20);
    });

    it('parses orderBy argument', () => {
      const result = parser.parse('{ employees(orderBy: { lastName: "asc", firstName: "desc" }) { id } }');
      expect(result.success).toBe(true);
      expect(result.params.orderBy).toEqual([
        { field: 'lastName', direction: 'asc' },
        { field: 'firstName', direction: 'desc' }
      ]);
    });

    it('parses a where clause with eq operator', () => {
      const result = parser.parse('{ employees(where: { firstName: { eq: "John" } }) { id firstName } }');
      expect(result.success).toBe(true);
      expect(result.params.where).toEqual({ firstName: { eq: 'John' } });
    });

    it('parses a where clause with numeric operator', () => {
      const result = parser.parse('{ employees(where: { age: { gt: 25 } }) { id } }');
      expect(result.success).toBe(true);
      expect(result.params.where).toEqual({ age: { gt: 25 } });
    });

    it('parses a where clause with AND', () => {
      const result = parser.parse(`{
        employees(where: { AND: [{ age: { gte: 18 } }, { firstName: { eq: "Alice" } }] }) {
          id
        }
      }`);
      expect(result.success).toBe(true);
      expect(result.params.where).toHaveProperty('AND');
    });

    it('parses boolean and null values', () => {
      const result = parser.parse('{ employees(where: { active: true, deletedAt: null }) { id } }');
      expect(result.success).toBe(true);
      expect(result.params.where?.active).toBe(true);
      expect(result.params.where?.deletedAt).toBe(null);
    });

    it('parses in operator with list values', () => {
      const result = parser.parse('{ employees(where: { id: { in: [1, 2, 3] } }) { id } }');
      expect(result.success).toBe(true);
      expect(result.params.where).toEqual({ id: { in: [1, 2, 3] } });
    });

    it('handles alias syntax', () => {
      const result = parser.parse('{ employees { empId: id name: firstName } }');
      expect(result.success).toBe(true);
      expect(result.params.fields).toContain('empId');
      expect(result.params.fields).toContain('name');
    });

    it('ignores nested (relation) fields in flat field list', () => {
      const result = parser.parse('{ employees { id firstName department { id name } } }');
      expect(result.success).toBe(true);
      // `department` has sub-fields so it should NOT appear in the flat list
      expect(result.params.fields).not.toContain('department');
      expect(result.params.fields).toContain('firstName');
    });

    it('ignores line comments', () => {
      const result = parser.parse(`
        # fetch all employees
        { employees { id # primary key
          firstName }
        }
      `);
      expect(result.success).toBe(true);
      expect(result.params.fields).toContain('id');
    });

    it('returns error message on malformed query', () => {
      const result = parser.parse('{ employees { id ');
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  // --- buildWhereExpression() ---

  describe('buildWhereExpression()', () => {
    it('returns empty Expression for empty where', () => {
      const expr = parser.buildWhereExpression({});
      expect(expr.exps).toHaveLength(0);
    });

    it('builds an equality expression', () => {
      const expr = parser.buildWhereExpression({ firstName: { eq: 'John' } });
      expect(expr.exps.length).toBeGreaterThan(0);
    });

    it('builds a greater-than expression', () => {
      const expr = parser.buildWhereExpression({ age: { gt: 18 } });
      expect(expr.exps.length).toBeGreaterThan(0);
    });

    it('builds IsNull for null value', () => {
      const expr = parser.buildWhereExpression({ email: null });
      expect(expr.exps.length).toBeGreaterThan(0);
    });

    it('builds AND expression from two conditions', () => {
      const expr = parser.buildWhereExpression({ firstName: { eq: 'A' }, age: { gt: 18 } });
      expect(expr.exps.length).toBeGreaterThan(0);
    });

    it('builds OR expression', () => {
      const expr = parser.buildWhereExpression({ OR: [{ firstName: { eq: 'A' } }, { firstName: { eq: 'B' } }] });
      expect(expr.exps.length).toBeGreaterThan(0);
    });

    it('builds NOT expression', () => {
      const expr = parser.buildWhereExpression({ NOT: { firstName: { eq: 'A' } } });
      expect(expr.exps.length).toBeGreaterThan(0);
    });

    it('builds LIKE expression for contains', () => {
      const expr = parser.buildWhereExpression({ firstName: { contains: 'oh' } });
      expect(expr.exps.length).toBeGreaterThan(0);
      // The LIKE value (%oh%) is nested in the expression tree; serialising the
      // whole tree is the simplest way to assert the wildcard is present.
      expect(JSON.stringify(expr)).toContain('%oh%');
    });

    it('builds NOT IN expression for notIn', () => {
      const expr = parser.buildWhereExpression({ id: { notIn: [1, 2] } });
      expect(expr.exps.length).toBeGreaterThan(0);
    });

    it('uses column name from fieldColumnMap', () => {
      const expr = parser.buildWhereExpression({ firstName: { eq: 'Alice' } });
      // The expression should reference the column name 'first_name'
      const colExpr = expr.exps[0] ?? expr;
      expect(JSON.stringify(colExpr)).toContain('first_name');
    });
  });
});

// ---------------------------------------------------------------------------
// IntrospectionProvider tests
// ---------------------------------------------------------------------------

describe('IntrospectionProvider', () => {
  let provider: IntrospectionProvider;

  beforeEach(() => {
    provider = new IntrospectionProvider().register(TestEmployee);
  });

  describe('buildEntityType()', () => {
    it('returns OBJECT type with correct name', () => {
      const type = provider.buildEntityType(TestEmployee);
      expect(type.kind).toBe('OBJECT');
      expect(type.name).toBe('TestEmployee');
    });

    it('includes all @Column-decorated fields', () => {
      const type = provider.buildEntityType(TestEmployee);
      const names = type.fields!.map(f => f.name);
      expect(names).toContain('id');
      expect(names).toContain('firstName');
      expect(names).toContain('lastName');
      expect(names).toContain('email');
      expect(names).toContain('age');
    });

    it('maps the @Id field to ID scalar', () => {
      const type = provider.buildEntityType(TestEmployee);
      const idField = type.fields!.find(f => f.name === 'id');
      expect(idField?.type.name).toBe('ID');
    });

    it('includes the DB column name in the description when it differs', () => {
      const type = provider.buildEntityType(TestEmployee);
      const field = type.fields!.find(f => f.name === 'firstName');
      expect(field?.description).toContain('first_name');
    });

    it('throws when entity has no @Column fields', () => {
      class NoColumns {}
      expect(() => provider.buildEntityType(NoColumns as never)).toThrow();
    });
  });

  describe('getSchemaIntrospection()', () => {
    it('returns data.__schema object', () => {
      const result = provider.getSchemaIntrospection();
      expect(result.data.__schema).toBeDefined();
    });

    it('queryType is Query', () => {
      const result = provider.getSchemaIntrospection();
      expect(result.data.__schema.queryType.name).toBe('Query');
    });

    it('includes built-in scalar types', () => {
      const result = provider.getSchemaIntrospection();
      const names = result.data.__schema.types.map(t => t.name);
      expect(names).toContain('String');
      expect(names).toContain('Int');
      expect(names).toContain('Boolean');
    });

    it('includes the registered entity type', () => {
      const result = provider.getSchemaIntrospection();
      const names = result.data.__schema.types.map(t => t.name);
      expect(names).toContain('TestEmployee');
    });

    it('Query type has a field for each registered entity', () => {
      const result = provider.getSchemaIntrospection();
      const queryType = result.data.__schema.types.find(t => t.name === 'Query');
      expect(queryType?.fields?.some(f => f.name.toLowerCase().includes('employee'))).toBe(true);
    });
  });

  describe('getTypeIntrospection()', () => {
    it('returns the entity type by name', () => {
      const result = provider.getTypeIntrospection('TestEmployee');
      expect(result.data.__type?.name).toBe('TestEmployee');
    });

    it('returns a built-in scalar', () => {
      const result = provider.getTypeIntrospection('String');
      expect(result.data.__type?.kind).toBe('SCALAR');
    });

    it('returns null for unknown type', () => {
      const result = provider.getTypeIntrospection('DoesNotExist');
      expect(result.data.__type).toBeNull();
    });
  });

  describe('execute()', () => {
    it('handles __schema query', () => {
      const result = provider.execute('{ __schema { queryType { name } } }');
      expect('data' in result && '__schema' in result.data).toBe(true);
    });

    it('handles __type query', () => {
      const result = provider.execute('{ __type(name: "TestEmployee") { name kind } }');
      expect('data' in result).toBe(true);
    });

    it('returns error for unsupported introspection query', () => {
      const result = provider.execute('{ employees { id } }') as { errors: { message: string }[] };
      expect(result.errors).toBeDefined();
    });
  });
});
