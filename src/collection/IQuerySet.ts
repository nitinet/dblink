import * as sql from 'dblink-core/src/sql/index.js';
import { Readable } from 'stream';
import Context from '../Context.js';
import * as exprBuilder from '../exprBuilder/index.js';
import { IEntityType } from 'dblink-core/src/types.js';

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
   * Get plain object list
   *
   * @abstract
   * @param {(keyof T)[]} keys
   * @returns {Promise<Partial<T>[]>}
   */
  abstract listPlain(keys: (keyof T)[]): Promise<Partial<T>[]>;

  /**
   * Get plain object list and total count
   *
   * @abstract
   * @param {(keyof T)[]} keys
   * @returns {Promise<{ count: number; values: Partial<T>[] }>}
   */
  abstract listPlainAndCount(keys: (keyof T)[]): Promise<{ count: number; values: Partial<T>[] }>;

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
   * @template {Object} U
   * @param {exprBuilder.types.IEntityType<U>} TargetType
   * @returns {IQuerySet<U>}
   */
  abstract select<U extends object>(TargetType: IEntityType<U>): IQuerySet<U>;

  /**
   * Function to generate Where clause
   *
   * @abstract
   * @param {exprBuilder.types.IWhereFunc<exprBuilder.WhereExprBuilder<T>>} func
   * @param {...any[]} args
   * @returns {IQuerySet<T>}
   */
  abstract where(func: exprBuilder.types.IWhereFunc<exprBuilder.WhereExprBuilder<T>>, ...args: unknown[]): IQuerySet<T>;

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

  // abstract join<A extends Object>(collection: IQuerySet<A>, func: types.IJoinFunc<model.WhereExprBuilder<T>, model.GroupExprBuilder<A>>, joinType?: sql.types.Join): IQuerySet<T & A>;

  // innerJoin<A extends Object>(coll: IQuerySet<A>, param: types.IJoinFunc<model.WhereExprBuilder<T>, model.GroupExprBuilder<A>>): IQuerySet<T & A> {
  // 	return this.join(coll, param, sql.types.Join.InnerJoin);
  // }

  // leftJoin<A extends Object>(coll: IQuerySet<A>, param: types.IJoinFunc<model.WhereExprBuilder<T>, model.GroupExprBuilder<A>>): IQuerySet<T & A> {
  // 	return this.join(coll, param, sql.types.Join.LeftJoin);
  // }

  // rightJoin<A extends Object>(coll: IQuerySet<A>, param: types.IJoinFunc<model.WhereExprBuilder<T>, model.GroupExprBuilder<A>>): IQuerySet<T & A> {
  // 	return this.join(coll, param, sql.types.Join.RightJoin);
  // }

  // outerJoin<A extends Object>(coll: IQuerySet<A>, param: types.IJoinFunc<model.WhereExprBuilder<T>, model.GroupExprBuilder<A>>): IQuerySet<T & A> {
  // 	return this.join(coll, param, sql.types.Join.OuterJoin);
  // }

  // Util function
  /**
   * Get Column Expressions
   *
   * @param {exprBuilder.FieldMapping[]} fields
   * @param {?string} [alias]
   * @returns {sql.Expression[]}
   */
  getColumnExprs(fields: exprBuilder.FieldMapping[], alias?: string): sql.Expression[] {
    const exprs = fields.map(field => {
      const val = alias ? alias + '.' + field.colName : field.colName;
      return new sql.Expression(val);
    });
    return exprs;
  }
}

export default IQuerySet;
