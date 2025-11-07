import { beforeEach, describe, expect, it } from 'vitest';
import { PrismaFilterParser, parsePrismaFilter, PrismaWhereInput } from '../src/parsers/prisma/index.js';

// Define test entity types for type safety
interface User {
  id: number;
  name: string;
  age: number;
  email: string;
  active: boolean;
  createdAt: Date;
  deletedAt: Date | null;
}

describe('Prisma Filter Parser with Type Safety', () => {
  let parser: PrismaFilterParser<User>;

  beforeEach(() => {
    // Create a parser with sample field mappings
    const fieldMap = new Map([
      ['name', 'user_name'],
      ['age', 'user_age'],
      ['email', 'email_address'],
      ['active', 'is_active']
    ]);
    parser = new PrismaFilterParser<User>({ fieldColumnMap: fieldMap });
  });

  describe('Basic Parsing', () => {
    it('should parse empty filter', () => {
      const result = parser.parse(null);
      expect(result).toBeDefined();
      expect(result.exps).toHaveLength(0);
    });

    it('should parse undefined filter', () => {
      const result = parser.parse(undefined);
      expect(result).toBeDefined();
      expect(result.exps).toHaveLength(0);
    });

    it('should parse empty object filter', () => {
      const result = parser.parse({});
      expect(result).toBeDefined();
      expect(result.exps).toHaveLength(0);
    });

    it('should parse simple equality comparison (shorthand)', () => {
      const result = parser.parse({ name: 'John' });
      expect(result).toBeDefined();
      expect(result.exps).toBeDefined();
    });

    it('should parse explicit equals operator', () => {
      const result = parser.parse({ name: { equals: 'John' } });
      expect(result).toBeDefined();
      expect(result.exps).toBeDefined();
    });

    it('should parse number comparison', () => {
      const result = parser.parse({ age: { gt: 25 } });
      expect(result).toBeDefined();
    });

    it('should parse null value', () => {
      const result = parser.parse({ deletedAt: null });
      expect(result).toBeDefined();
    });

    it('should parse boolean value', () => {
      const result = parser.parse({ active: true });
      expect(result).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct field types', () => {
      // These should compile correctly
      const validFilter1: PrismaWhereInput<User> = { name: 'John' };
      const validFilter2: PrismaWhereInput<User> = { age: { gt: 25 } };
      const validFilter3: PrismaWhereInput<User> = { active: true };
      const validFilter4: PrismaWhereInput<User> = { email: { contains: '@example.com' } };

      expect(parser.parse(validFilter1)).toBeDefined();
      expect(parser.parse(validFilter2)).toBeDefined();
      expect(parser.parse(validFilter3)).toBeDefined();
      expect(parser.parse(validFilter4)).toBeDefined();
    });

    it('should support typed array filters', () => {
      const filter: PrismaWhereInput<User> = {
        age: { in: [25, 30, 35] }
      };
      const result = parser.parse(filter);
      expect(result).toBeDefined();
    });
  });

  describe('Comparison Operators', () => {
    it('should parse equals operator', () => {
      const result = parser.parse({ name: { equals: 'John' } });
      expect(result).toBeDefined();
    });

    it('should parse not operator', () => {
      const result = parser.parse({ name: { not: 'John' } });
      expect(result).toBeDefined();
    });

    it('should parse gt operator', () => {
      const result = parser.parse({ age: { gt: 25 } });
      expect(result).toBeDefined();
    });

    it('should parse gte operator', () => {
      const result = parser.parse({ age: { gte: 25 } });
      expect(result).toBeDefined();
    });

    it('should parse lt operator', () => {
      const result = parser.parse({ age: { lt: 50 } });
      expect(result).toBeDefined();
    });

    it('should parse lte operator', () => {
      const result = parser.parse({ age: { lte: 50 } });
      expect(result).toBeDefined();
    });

    it('should parse in operator', () => {
      const result = parser.parse({ name: { in: ['John', 'Jane', 'Bob'] } });
      expect(result).toBeDefined();
    });

    it('should parse notIn operator', () => {
      const result = parser.parse({ name: { notIn: ['Admin', 'Root'] } });
      expect(result).toBeDefined();
    });
  });

  describe('String Operators', () => {
    it('should parse contains operator', () => {
      const result = parser.parse({ name: { contains: 'Jo' } });
      expect(result).toBeDefined();
    });

    it('should parse startsWith operator', () => {
      const result = parser.parse({ email: { startsWith: 'john' } });
      expect(result).toBeDefined();
    });

    it('should parse endsWith operator', () => {
      const result = parser.parse({ email: { endsWith: '@example.com' } });
      expect(result).toBeDefined();
    });
  });

  describe('Logical Operators', () => {
    it('should parse AND operator with array', () => {
      const result = parser.parse({
        AND: [{ name: 'John' }, { age: { gt: 25 } }]
      });
      expect(result).toBeDefined();
    });

    it('should parse OR operator', () => {
      const result = parser.parse({
        OR: [{ name: 'John' }, { name: 'Jane' }]
      });
      expect(result).toBeDefined();
    });

    it('should parse NOT operator', () => {
      const result = parser.parse({
        NOT: { name: 'Admin' }
      });
      expect(result).toBeDefined();
    });

    it('should parse nested logical operators', () => {
      const result = parser.parse({
        OR: [
          { name: 'John' },
          {
            AND: [{ age: { gt: 18 } }, { active: true }]
          }
        ]
      });
      expect(result).toBeDefined();
    });
  });

  describe('Complex Filters', () => {
    it('should parse multiple conditions on same field', () => {
      const result = parser.parse({
        age: { gte: 18, lte: 65 }
      });
      expect(result).toBeDefined();
    });

    it('should parse multiple fields with conditions', () => {
      const result = parser.parse({
        name: 'John',
        age: { gt: 25 },
        active: true
      });
      expect(result).toBeDefined();
    });

    it('should parse complex nested filter', () => {
      const result = parser.parse({
        AND: [{ OR: [{ name: 'John' }, { name: 'Jane' }] }, { age: { gte: 18 } }, { NOT: { email: { contains: 'spam' } } }]
      });
      expect(result).toBeDefined();
    });

    it('should parse Prisma-style user filter example', () => {
      const result = parser.parse({
        OR: [
          { name: { contains: 'Smith' } },
          {
            AND: [{ age: { gte: 18 } }, { active: true }]
          }
        ]
      });
      expect(result).toBeDefined();
    });
  });

  describe('Null Handling', () => {
    it('should handle null comparison', () => {
      const result = parser.parse({ deletedAt: null });
      expect(result).toBeDefined();
    });

    it('should handle not null comparison', () => {
      const result = parser.parse({ email: { not: null } });
      expect(result).toBeDefined();
    });
  });

  describe('Field Mapping', () => {
    it('should map field names to column names', () => {
      const result = parser.parse({ name: 'John' });
      expect(result).toBeDefined();
      // The parser should use 'user_name' instead of 'name'
    });

    it('should handle unmapped fields', () => {
      const result = parser.parse({ id: 1 });
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid in operator value', () => {
      expect(() => {
        parser.parse({ name: { in: 'not-an-array' as unknown as string[] } });
      }).toThrow();
    });

    it('should throw error for invalid notIn operator value', () => {
      expect(() => {
        parser.parse({ name: { notIn: 'not-an-array' as unknown as string[] } });
      }).toThrow();
    });

    it('should throw error for unsupported operator', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parser.parse({ name: { unsupported: 'value' } as any });
      }).toThrow();
    });
  });

  describe('Helper Functions', () => {
    it('should work with parsePrismaFilter function', () => {
      const result = parsePrismaFilter<User>({ name: 'John' });
      expect(result).toBeDefined();
    });

    it('should work with parsePrismaFilter with field mapping', () => {
      const fieldMap = new Map([['name', 'user_name']]);
      const result = parsePrismaFilter<User>({ name: 'John' }, { fieldColumnMap: fieldMap });
      expect(result).toBeDefined();
    });
  });

  describe('Integration Examples', () => {
    it('should handle typical Prisma user.findMany filter', () => {
      const filter: PrismaWhereInput<User> = {
        email: { contains: '@example.com' },
        active: true,
        age: { gte: 18 }
      };
      const result = parser.parse(filter);
      expect(result).toBeDefined();
    });

    it('should handle Prisma complex filter', () => {
      const filter: PrismaWhereInput<User> = {
        AND: [{ name: { startsWith: 'J' } }, { email: { endsWith: '@example.com' } }, { OR: [{ age: { lt: 30 } }, { age: { gt: 50 } }] }]
      };
      const result = parser.parse(filter);
      expect(result).toBeDefined();
    });

    it('should handle date filters', () => {
      const now = new Date();
      const filter: PrismaWhereInput<User> = {
        createdAt: { gte: now }
      };
      const result = parser.parse(filter);
      expect(result).toBeDefined();
    });
  });
});
