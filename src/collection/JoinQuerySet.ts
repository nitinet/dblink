import * as sql from 'dblink-core/src/sql/index.js';
import Operator from 'dblink-core/src/sql/types/Operator.js';
import { cloneDeep } from 'lodash-es';
import { Readable, Transform, TransformCallback } from 'node:stream';
import Context from '../Context.js';
import * as exprBuilder from '../exprBuilder/index.js';
import IQuerySet, { ColumnInfo } from './IQuerySet.js';
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
   * Fields retained by select(); null means "all columns".
   *
   * @private
   * @type {(Set<keyof (T & U)> | null)}
   */
  private selectedFields: Set<keyof (T & U)> | null = null;

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
    this.stat.collection.join = joinType;
    this.stat.collection.onExpr = onExpr;
  }

  /**
   * Qualified column descriptors: the left and right sets' descriptors
   * concatenated. Because each child already qualifies its own columns
   * (`e.id`, `d.name`, …), this composes correctly through nested joins.
   *
   * @returns {ColumnInfo<T & U>[]}
   */
  getColumnInfo(): ColumnInfo<T & U>[] {
    return [...(this.leftQuerySet.getColumnInfo() as ColumnInfo<T & U>[]), ...(this.rightQuerySet.getColumnInfo() as ColumnInfo<T & U>[])];
  }

  /**
   * Column descriptors after applying any select() narrowing.
   */
  private selectedColumns(): ColumnInfo<T & U>[] {
    const cols = this.getColumnInfo();
    const selected = this.selectedFields;
    return selected ? cols.filter(c => selected.has(c.field)) : cols;
  }

  initColumnFieldMap() {
    if (this.columnFieldMap.size > 0) return;
    this.selectedColumns().forEach(c => this.columnFieldMap.set(c.colAs, c.field));
  }

  /**
   * Helper to create field-to-column map returning qualified "alias.colName"
   * references for WHERE / ORDER BY / ON. When both sides share a field name
   * (e.g. `id`), the left (driving) set wins.
   */
  private getFieldColumnMap(): Map<keyof (T & U), string> {
    const result = new Map<keyof (T & U), string>();
    this.getColumnInfo().forEach(c => {
      if (!result.has(c.field)) result.set(c.field, c.colRef);
    });
    return result;
  }

  /**
   * Helper to validate if expression is valid and non-empty. See the identical check in
   * QuerySet.isValidExpression for why bare leaf expressions (a `value` with no `exps`, e.g. from
   * GroupExprBuilder.expr()) must also count as valid, not just compound ones.
   */
  private isValidExpression(expr: sql.Expression | null): expr is sql.Expression {
    return expr instanceof sql.Expression && (expr.exps.length > 0 || !!expr.value);
  }

  // Select Functions
  /**
   * Prepare select statement
   */
  prepareSelectStatement() {
    this.initColumnFieldMap();

    this.stat.command = sql.types.Command.SELECT;

    this.selectedColumns().forEach(c => {
      this.stat.columns.push(new sql.Expression(`${c.colRef} as ${c.colAs}`));
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
    countStmt.command = sql.types.Command.SELECT;
    countStmt.columns = [new sql.Expression('count(1) as count')];
    countStmt.groupBy = [];
    countStmt.orderBy = [];
    countStmt.limit = new sql.Expression();
    countStmt.where = new sql.Expression(null, Operator.And, countStmt.where, this.leftQuerySet.stat.where, this.rightQuerySet.stat.where);
    const countResult = await this.context.runStatement(countStmt);
    // Drivers such as node-postgres return count() (bigint) as a string; coerce to number.
    return Number(countResult.rows[0]['count']);
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
        objectMode: true,
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
   * @template K
   * @param {K[]} keys
   * @returns {JoinQuerySet<Pick<T & U, K>>}
   */
  select<K extends keyof (T & U)>(keys: K[]): IQuerySet<Pick<T & U, K>> {
    this.selectedFields = new Set<keyof (T & U)>(keys);
    this.columnFieldMap.clear();
    this.initColumnFieldMap();
    return this as unknown as IQuerySet<Pick<T & U, K>>;
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
    const fieldColumnMap = this.getFieldColumnMap();
    const eb = new exprBuilder.WhereExprBuilder<T & U>(fieldColumnMap);
    const res = param(eb, args);
    if (this.isValidExpression(res)) {
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
    const fieldColumnMap = this.getFieldColumnMap();
    const eb = new exprBuilder.GroupExprBuilder<T & U>(fieldColumnMap);
    const res = param(eb);
    if (res && Array.isArray(res)) {
      res.forEach(expr => {
        if (this.isValidExpression(expr)) {
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
    const fieldColumnMap = this.getFieldColumnMap();
    const eb = new exprBuilder.OrderExprBuilder<T & U>(fieldColumnMap);
    const res = param(eb);
    if (res && Array.isArray(res)) {
      res.forEach(expr => {
        if (this.isValidExpression(expr)) {
          this.stat.orderBy.push(expr);
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

    const mainFieldColumnMap = this.getFieldColumnMap();
    const mainObj = new exprBuilder.WhereExprBuilder<T & U>(mainFieldColumnMap);

    joinSet.initColumnFieldMap();
    const joinFieldColumnMap = new Map(Array.from(joinSet.columnFieldMap.entries()).map(([key, value]) => [value, key]));
    const joinObj = new exprBuilder.BaseExprBuilder(joinFieldColumnMap, joinSet.stat.collection.alias ?? undefined);

    const onExpr = param(mainObj, joinObj);

    if (!this.isValidExpression(onExpr)) throw new Error('Invalid Join');

    return new JoinQuerySet<T & U, A>(this.context, joinType, this, joinSet, onExpr);
  }
}

export default JoinQuerySet;
