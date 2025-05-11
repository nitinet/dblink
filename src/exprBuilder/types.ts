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
 * Keyof Type
 * Type utility for getting keys of type T
 *
 * @typedef {KeyOf}
 * @template T
 */
type KeyOf<T> = keyof T;

/**
 * Operand Type
 * Represents the type of an operand based on the key K of type T
 *
 * @typedef {OperandType}
 * @template T
 * @template K
 */
type OperandType<T, K extends keyof T> = T[K] | Expression;

export { IArrFieldFunc, IJoinFunc, IWhereFunc, KeyOf, OperandType };
