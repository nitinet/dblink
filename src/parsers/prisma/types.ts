/**
 * Prisma Parser Types
 *
 * Type definitions for Prisma-style filters with type safety
 */

/**
 * Prisma Filter parsing error
 */
export class PrismaFilterParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrismaFilterParseError';
  }
}

/**
 * String filter operators
 */
/**
 * Base string filter with Prisma operators
 */
export interface StringFilter {
  equals?: string;
  not?: string | null;
  in?: string[];
  notIn?: string[];
  lt?: string;
  lte?: string;
  gt?: string;
  gte?: string;
  contains?: string;
  startsWith?: string;
  endsWith?: string;
}

/**
 * Number filter operators
 */
export type NumberFilter<T = number> = {
  equals?: T;
  not?: T | null;
  in?: T[];
  notIn?: T[];
  lt?: T;
  lte?: T;
  gt?: T;
  gte?: T;
};

/**
 * Boolean filter operators
 */
export type BooleanFilter = {
  equals?: boolean;
  not?: boolean | null;
};

/**
 * Date filter operators
 */
export type DateFilter = {
  equals?: Date | string;
  not?: Date | string | null;
  in?: (Date | string)[];
  notIn?: (Date | string)[];
  lt?: Date | string;
  lte?: Date | string;
  gt?: Date | string;
  gte?: Date | string;
};

/**
 * Generic scalar filter for any comparable type
 */
export type ScalarFilter<T> = {
  equals?: T;
  not?: T | null;
  in?: T[];
  notIn?: T[];
  lt?: T;
  lte?: T;
  gt?: T;
  gte?: T;
};

/**
 * Field filter type based on the field type
 */
export type FieldFilter<T> = T extends string
  ? T | StringFilter
  : T extends number
    ? T | NumberFilter<T>
    : T extends boolean
      ? T | BooleanFilter
      : T extends Date
        ? T | DateFilter
        : T extends null
          ? null
          : T | ScalarFilter<T>;

/**
 * Logical operators for combining filters
 */
export type LogicalOperators<T> = {
  AND?: PrismaWhereInput<T>[];
  OR?: PrismaWhereInput<T>[];
  NOT?: PrismaWhereInput<T> | PrismaWhereInput<T>[];
};

/**
 * Main where input type with type safety
 */
export type PrismaWhereInput<T> = LogicalOperators<T> & {
  [K in keyof T]?: FieldFilter<T[K]> | null;
};

/**
 * Type-safe Prisma filter options
 */
export interface PrismaFilterOptions {
  /**
   * Map of entity field names to database column names
   */
  fieldColumnMap?: Map<string, string>;

  /**
   * Whether to validate field names against the entity type
   */
  validateFields?: boolean;
}
