import Expression from 'dblink-core/src/sql/Expression.js';

/**
 * Array Field Function Type
 *
 * @typedef {IArrFieldFunc}
 * @template T
 */
type IArrFieldFunc<T> = (source: T) => Expression[];

/**
 * Join Function Type
 *
 * @typedef {IJoinFunc}
 * @template A
 * @template B
 */
type IJoinFunc<A, B> = (sourceA: A, sourceB: B) => Expression;

/**
 * Where Function Type
 *
 * @typedef {IWhereFunc}
 * @template T
 */
type IWhereFunc<T> = (source: T, ...args: unknown[]) => Expression;

/**
 * Entity Type
 *
 * @typedef {IEntityType}
 * @template T
 */
type IEntityType<T> = new (...args: unknown[]) => T;

/**
 * Column Type
 *
 * @typedef {ColumnType}
 */
type ColumnType = boolean | number | bigint | string | Buffer | Date;

/**
 * Keyof Type
 *
 * @typedef {KeyOf}
 * @template T
 */
type KeyOf<T> = keyof T;

/**
 * Opoerand Type
 *
 * @typedef {OperandType}
 * @template T
 * @template {keyof T} K
 */
type OperandType<T, K extends keyof T> = T[K] | Expression;

export { ColumnType, IArrFieldFunc, IEntityType, IJoinFunc, IWhereFunc, KeyOf, OperandType };
