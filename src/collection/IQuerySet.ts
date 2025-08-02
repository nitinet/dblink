import { Readable } from 'stream';
import Context from '../Context.js';
import * as exprBuilder from '../exprBuilder/index.js';
import { WhereExprBuilder } from '../exprBuilder/index.js';
import { IForeignFunc, IWhereFunc } from '../exprBuilder/types.js';
import { sql } from 'dblink-core';
import JoinQuerySet from './JoinQuerySet.js';

/**
 * IQuerySet
 *
 * @abstract
 * @class IQuerySet
 * @typedef {IQuerySet}
 * @template {Object} T
 */
abstract class IQuerySet<T extends object> {
  /**
   * Database Context
   *
   * @type {!Context}
   */
  context!: Context;

  /**
   * Statement
   *
   * @type {*}
   */
  stat: sql.Statement = new sql.Statement(sql.types.Command.SELECT);

  columnFieldMap = new Map<string, keyof T>();

  abstract initColumnFieldMap(): void;

  // Selection Functions
  /**
   * Get total count of entity objects
   *
   * @abstract
   * @returns {Promise<number>}
   */
  abstract count(): Promise<number>;

  /**
   * Get entity object list
   *
   * @abstract
   * @returns {Promise<T[]>}
   */
  abstract list(): Promise<T[]>;

  /**
   * Get entity objects list and total count
   *
   * @abstract
   * @returns {Promise<{ count: number; values: T[] }>}
   */
  abstract listAndCount(): Promise<{ count: number; values: T[] }>;

  /**
   * Get stream of Entity objects
   *
   * @abstract
   * @returns {Promise<Readable>}
   */
  abstract stream(): Promise<Readable>;

  /**
   * Get Entity object
   *
   * @async
   * @returns {Promise<T | null>}
   */
  async single(): Promise<T | null> {
    const arr = await this.list();
    if (arr.length > 1) throw new Error('More than one row found in unique call');
    else if (arr.length == 0) return null;
    else return arr[0];
  }

  /**
   * Get Entity object or throw
   *
   * @async
   * @returns {Promise<T>}
   */
  async singleOrThrow(): Promise<T> {
    const val = await this.single();
    if (!val) throw new Error('Value Not Found');
    return val;
  }

  /**
   * Get Queryable Select object with custom Type
   *
   * @abstract
   * @param {(keyof T)[]} columnKeys
   * @returns {IQuerySet<T>}
   */
  abstract select(columnKeys: (keyof T)[]): IQuerySet<T>;

  /**
   * Function to generate Where clause
   *
   * @abstract
   * @param {IWhereFunc<WhereExprBuilder<T>>} func
   * @param {...any[]} args
   * @returns {IQuerySet<T>}
   */
  abstract where(func: IWhereFunc<WhereExprBuilder<T>>, ...args: unknown[]): IQuerySet<T>;

  /**
   * Function to generate Group By clause
   *
   * @abstract
   * @param {exprBuilder.types.IArrFieldFunc<exprBuilder.GroupExprBuilder<T>>} func
   * @returns {IQuerySet<T>}
   */
  abstract groupBy(func: exprBuilder.types.IArrFieldFunc<exprBuilder.GroupExprBuilder<T>>): IQuerySet<T>;

  /**
   * Function to generate Order By clause
   *
   * @abstract
   * @param {exprBuilder.types.IArrFieldFunc<exprBuilder.OrderExprBuilder<T>>} func
   * @returns {IQuerySet<T>}
   */
  abstract orderBy(func: exprBuilder.types.IArrFieldFunc<exprBuilder.OrderExprBuilder<T>>): IQuerySet<T>;

  /**
   * Function to generate Limit clause
   *
   * @abstract
   * @param {number} size
   * @param {?number} [index]
   * @returns {IQuerySet<T>}
   */
  abstract limit(size: number, index?: number): IQuerySet<T>;

  abstract join<A extends object>(expr: IQuerySet<A>, param: IForeignFunc<exprBuilder.WhereExprBuilder<T>, exprBuilder.BaseExprBuilder<A>>, joinType?: sql.types.Join): JoinQuerySet<T, A>;
}

export default IQuerySet;
