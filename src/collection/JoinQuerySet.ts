import * as sql from 'dblink-core/src/sql/index.js';
import Operator from 'dblink-core/src/sql/types/Operator.js';
import { cloneDeep } from 'lodash-es';
import { Readable, Transform, TransformCallback } from 'node:stream';
import Context from '../Context.js';
import * as exprBuilder from '../exprBuilder/index.js';
import IQuerySet from './IQuerySet.js';
import { IForeignFunc } from '../exprBuilder/types.js';

/**
 * QuerySet
 */
class JoinQuerySet<T extends object, U extends object> extends IQuerySet<T & U> {
  joinType: sql.types.Join;
  leftQuerySet: IQuerySet<T>;
  rightQuerySet: IQuerySet<U>;
  onExpr: sql.Expression;

  /**
   * Creates an instance of QuerySet.
   *
   * @constructor
   * @param {Context} context
   * @param {sql.types.Join} joinType
   * @param {IQuerySet<T>} leftQuerySet
   * @param {IQuerySet<U>} rightQuerySet
   */
  constructor(context: Context, joinType: sql.types.Join, leftQuerySet: IQuerySet<T>, rightQuerySet: IQuerySet<U>, onExpr: sql.Expression) {
    super();
    this.context = context;
    this.joinType = joinType;
    this.leftQuerySet = leftQuerySet;
    this.rightQuerySet = rightQuerySet;
    this.onExpr = onExpr;

    this.stat.collection.leftColl = leftQuerySet.stat.collection;
    this.stat.collection.rightColl = rightQuerySet.stat.collection;
    this.stat.collection.onExpr = onExpr;
  }

  initColumnFieldMap() {
    if (this.columnFieldMap.size == 0) return;

    this.leftQuerySet.initColumnFieldMap();
    this.leftQuerySet.columnFieldMap.forEach((field, colName) => {
      this.columnFieldMap.set(colName, field);
    });

    this.rightQuerySet.initColumnFieldMap();
    this.rightQuerySet.columnFieldMap.forEach((field, colName) => {
      this.columnFieldMap.set(colName, field);
    });
  }

  // Select Functions
  /**
   * Prepare select statement
   */
  prepareSelectStatement() {
    this.initColumnFieldMap();

    this.stat.command = sql.types.Command.SELECT;

    this.columnFieldMap.forEach((_, colName) => {
      this.stat.columns.push(new sql.Expression(colName));
    });

    this.stat.where = new sql.Expression(null, Operator.And, this.stat.where, this.leftQuerySet.stat.where, this.rightQuerySet.stat.where);
    this.stat.groupBy = [...this.stat.groupBy, ...this.leftQuerySet.stat.groupBy, ...this.rightQuerySet.stat.groupBy];
    this.stat.orderBy = [...this.stat.orderBy, ...this.leftQuerySet.stat.orderBy, ...this.rightQuerySet.stat.orderBy];
  }

  /**
   * Get entity object list
   *
   * @async
   * @returns {Promise<T[]>}
   */
  async list(): Promise<(T & U)[]> {
    this.prepareSelectStatement();
    const result = await this.context.runStatement(this.stat);
    return Promise.all(result.rows.map(this.transformer.bind(this)));
  }

  /**
   * Get total count of entity objects
   *
   * @async
   * @returns {Promise<number>}
   */
  async count(): Promise<number> {
    const countStmt = cloneDeep(this.stat);
    countStmt.columns = [new sql.Expression('count(1) as count')];
    countStmt.groupBy.length = 0;
    countStmt.orderBy.length = 0;
    countStmt.limit = new sql.Expression();
    const countResult = await this.context.runStatement(countStmt);
    return countResult.rows[0]['count'] as number;
  }

  /**
   * Get entity objects list and total count
   *
   * @async
   * @returns {Promise<{ count: number; values: T[] }>}
   */
  async listAndCount(): Promise<{ count: number; values: (T & U)[] }> {
    const values = await this.list();
    const count = await this.count();
    return { count, values };
  }

  /**
   * Transformer function to get Entity object
   *
   * @param {Record<string, unknown>} row
   * @returns {T}
   */
  async transformer(row: Record<string, unknown>): Promise<T & U> {
    const obj = {} as T & U;
    this.columnFieldMap.forEach((field, colName) => {
      obj[field] = row[colName] as (T & U)[keyof T] & (T & U)[keyof U];
    });

    return obj;
  }

  /**
   * Get stream of Entity objects
   *
   * @async
   * @returns {Promise<Readable>}
   */
  async stream(): Promise<Readable> {
    this.prepareSelectStatement();
    const dataStream = await this.context.streamStatement(this.stat);

    const transformerFunc = this.transformer.bind(this);

    return dataStream.pipe(
      new Transform({
        transform: async (chunk: Record<string, unknown>, encoding: BufferEncoding, callback: TransformCallback) => {
          const data: T = await transformerFunc(chunk);
          callback(null, data);
        }
      })
    );
  }

  // Selection Functions
  /**
   * Get Queryable Select object with custom Type
   *
   * @param {(keyof (T & U))[]} columnKeys
   * @returns {JoinQuerySet<U>}
   */
  select(fields: (keyof (T & U))[]): this {
    this.leftQuerySet.initColumnFieldMap();
    this.leftQuerySet.columnFieldMap.forEach((field, colName) => {
      if (fields.includes(field)) this.columnFieldMap.set(colName, field);
    });

    this.rightQuerySet.initColumnFieldMap();
    this.rightQuerySet.columnFieldMap.forEach((field, colName) => {
      if (fields.includes(field)) this.columnFieldMap.set(colName, field);
    });

    return this;
  }

  // Conditional Functions
  /**
   * Function to generate Where clause
   *
   * @param {exprBuilder.types.IWhereFunc<exprBuilder.WhereExprBuilder<T & U>>} param
   * @param {...any[]} args
   * @returns {this}
   */
  where(param: exprBuilder.types.IWhereFunc<exprBuilder.WhereExprBuilder<T & U>>, ...args: unknown[]): this {
    const fieldColumnMap = new Map(Array.from(this.columnFieldMap.entries()).map(([key, value]) => [value, key])) as Map<keyof (T & U), string>;
    const eb = new exprBuilder.WhereExprBuilder<T & U>(fieldColumnMap);
    const res = param(eb, args);
    if (res && res instanceof sql.Expression && res.exps.length > 0) {
      this.stat.where = this.stat.where.add(res);
    }
    return this;
  }

  /**
   * Function to generate Group By clause
   *
   * @param {exprBuilder.types.IArrFieldFunc<exprBuilder.GroupExprBuilder<T & U>>} param
   * @returns {this}
   */
  groupBy(param: exprBuilder.types.IArrFieldFunc<exprBuilder.GroupExprBuilder<T & U>>): this {
    const fieldColumnMap = new Map(Array.from(this.columnFieldMap.entries()).map(([key, value]) => [value, key])) as Map<keyof (T & U), string>;
    const eb = new exprBuilder.GroupExprBuilder<T & U>(fieldColumnMap);
    const res = param(eb);
    if (res && Array.isArray(res)) {
      res.forEach(expr => {
        if (expr instanceof sql.Expression && expr.exps.length > 0) {
          this.stat.groupBy.push(expr);
        }
      });
    }
    return this;
  }

  /**
   * Function to generate Order By clause
   *
   * @param {exprBuilder.types.IArrFieldFunc<exprBuilder.OrderExprBuilder<T & U>>} param
   * @returns {this}
   */
  orderBy(param: exprBuilder.types.IArrFieldFunc<exprBuilder.OrderExprBuilder<T & U>>): this {
    const fieldColumnMap = new Map(Array.from(this.columnFieldMap.entries()).map(([key, value]) => [value, key])) as Map<keyof (T & U), string>;
    const eb = new exprBuilder.OrderExprBuilder<T & U>(fieldColumnMap);
    const res = param(eb);
    if (res && Array.isArray(res)) {
      res.forEach(a => {
        if (a instanceof sql.Expression && a.exps.length > 0) {
          this.stat.orderBy.push(a);
        }
      });
    }
    return this;
  }

  /**
   * Function to generate Limit clause
   *
   * @param {number} size
   * @param {?number} [index]
   * @returns {this}
   */
  limit(size: number, index?: number): this {
    this.stat.limit = new sql.Expression(null, sql.types.Operator.Limit);
    this.stat.limit.exps.push(new sql.Expression(size.toString()));
    if (index) {
      this.stat.limit.exps.push(new sql.Expression(index.toString()));
    }
    return this;
  }

  join<A extends object>(joinSet: IQuerySet<A>, param: IForeignFunc<exprBuilder.WhereExprBuilder<T & U>, exprBuilder.BaseExprBuilder<A>>, joinType?: sql.types.Join): JoinQuerySet<T & U, A> {
    joinType = joinType ?? sql.types.Join.InnerJoin;

    let temp: sql.Expression | null = null;
    if (param && param instanceof Function) {
      const mainFieldColumnMap = new Map(Array.from(this.columnFieldMap.entries()).map(([key, value]) => [value, key]));
      const mainObj = new exprBuilder.WhereExprBuilder<T & U>(mainFieldColumnMap);

      const joinFieldColumnMap = new Map(Array.from(joinSet.columnFieldMap.entries()).map(([key, value]) => [value, key]));
      const joinObj = new exprBuilder.BaseExprBuilder(joinFieldColumnMap);
      temp = param(mainObj, joinObj);
    }

    if (!(temp && temp instanceof sql.Expression && temp.exps.length > 0)) throw new Error('Invalid Join');

    const joinQuerySet = new JoinQuerySet<T & U, A>(this.context, joinType, this, joinSet, temp);

    return joinQuerySet;
  }
}

export default JoinQuerySet;
