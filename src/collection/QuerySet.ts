import { plainToInstance } from 'class-transformer';
import * as sql from 'dblink-core/src/sql/index.js';
import { IEntityType } from 'dblink-core/src/types.js';
import { cloneDeep } from 'lodash-es';
import { Readable, Transform, TransformCallback } from 'node:stream';
import Context from '../Context.js';
import { FOREIGN_KEY_FUNC, FOREIGN_KEY_TYPE, TABLE_COLUMN_KEYS } from '../decorators/Constants.js';
import * as exprBuilder from '../exprBuilder/index.js';
import { IForeignFunc } from '../exprBuilder/types.js';
import DBSet from './DBSet.js';
import IQuerySet from './IQuerySet.js';
import JoinQuerySet from './JoinQuerySet.js';

/**
 * QuerySet
 */
class QuerySet<T extends object> extends IQuerySet<T> {
  /**
   * Entity Type
   *
   * @protected
   * @type {IEntityType<T>}
   */
  protected EntityType: IEntityType<T>;

  /**
   * Db Set linked to database table
   *
   * @protected
   * @type {DBSet}
   */
  protected dbSet: DBSet;

  /**
   * Foreign Keys
   *
   * @type {(keyof T)[]}
   */
  foreignKeys: (keyof T)[] = [];

  /**
   * Creates an instance of QuerySet.
   *
   * @constructor
   * @param {Context} context
   * @param {IEntityType<T>} EntityType
   * @param {DBSet} dbSet
   */
  constructor(context: Context, EntityType: IEntityType<T>, dbSet: DBSet) {
    super();

    this.context = context;
    this.EntityType = EntityType;
    this.dbSet = dbSet;

    this.stat.collection.value = this.dbSet.tableName;
    this.stat.collection.alias = this.dbSet.tableName.charAt(0);
  }

  initColumnFieldMap() {
    if (this.columnFieldMap.size !== 0) return;

    const fields = Reflect.getMetadata(TABLE_COLUMN_KEYS, this.EntityType.prototype) as (keyof T)[];
    fields.forEach(field => {
      const fieldMapping = this.dbSet.fieldMap.get(field as string);
      if (fieldMapping) {
        this.columnFieldMap.set(fieldMapping.colName, field);
      }
    });
  }

  // Select Functions
  /**
   * Prepare select statement
   */
  prepareSelectStatement() {
    this.initColumnFieldMap();

    this.columnFieldMap.forEach((_, colName) => {
      this.stat.columns.push(new sql.Expression(colName));
    });
  }

  /**
   * Get entity object list
   *
   * @async
   * @returns {Promise<T[]>}
   */
  async list(): Promise<T[]> {
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
  async listAndCount(): Promise<{ count: number; values: T[] }> {
    const values = await this.list();
    const count = await this.count();
    return { count, values };
  }

  /**
   * Transformer function to get Entity object
   *
   * @param {any} row
   * @returns {T}
   */
  async transformer(row: Record<string, unknown>): Promise<T> {
    this.columnFieldMap.forEach((field, colName) => {
      if (field != colName) {
        row[field as string] = row[colName];
      }
    });

    const obj = plainToInstance(this.EntityType, row, { enableImplicitConversion: true, excludeExtraneousValues: true });

    await Promise.all(
      this.foreignKeys.map(async key => {
        const foreignType: IEntityType<object> = Reflect.getMetadata(FOREIGN_KEY_TYPE, obj, key as string);
        const foreignFunc: IForeignFunc<exprBuilder.WhereExprBuilder<object>, T> = Reflect.getMetadata(FOREIGN_KEY_FUNC, obj, key as string);
        const propertyType = Reflect.getMetadata('design:type', obj, key as string);

        if (!foreignType || !foreignFunc || !propertyType) return;

        const foreignTableSet = this.context.tableSetMap.get(foreignType);
        if (!foreignTableSet) throw new TypeError('Invalid Type');

        const foreignQuerySet = foreignTableSet.where(eb => {
          return foreignFunc(eb, obj);
        });

        if (propertyType === Array) {
          const data = await foreignQuerySet.list();
          Reflect.set(obj, key, data);
        } else {
          const data = await foreignQuerySet.single();
          Reflect.set(obj, key, data);
        }
      })
    );

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
   * @param {(keyof T)[]} columnKeys
   * @returns {QuerySet<U>}
   */
  select(fields: (keyof T)[]): this {
    fields.forEach(field => {
      const fieldMapping = this.dbSet.fieldMap.get(field as string);
      if (fieldMapping) {
        this.columnFieldMap.set(fieldMapping.colName, field);
      }
    });

    return this;
  }

  /**
   * Get Queryable Select object with custom Type
   *
   * @param {(keyof T)[]} foreignKeys
   * @returns {this}
   */
  include(foreignKeys: (keyof T)[]): this {
    this.foreignKeys.push(...foreignKeys);
    return this;
  }

  // Conditional Functions
  /**
   * Function to generate Where clause
   *
   * @param {exprBuilder.types.IWhereFunc<exprBuilder.WhereExprBuilder<T>>} param
   * @param {...any[]} args
   * @returns {this}
   */
  where(param: exprBuilder.types.IWhereFunc<exprBuilder.WhereExprBuilder<T>>, ...args: unknown[]): this {
    const fieldColumnMap = new Map(Array.from(this.dbSet.fieldMap.entries()).map(([key, value]) => [key, value.colName])) as Map<keyof T, string>;
    const eb = new exprBuilder.WhereExprBuilder<T>(fieldColumnMap);
    const res = param(eb, args);
    if (res && res instanceof sql.Expression && res.exps.length > 0) {
      this.stat.where = this.stat.where.add(res);
    }
    return this;
  }

  /**
   * Function to generate Group By clause
   *
   * @param {exprBuilder.types.IArrFieldFunc<exprBuilder.GroupExprBuilder<T>>} param
   * @returns {this}
   */
  groupBy(param: exprBuilder.types.IArrFieldFunc<exprBuilder.GroupExprBuilder<T>>): this {
    const fieldColumnMap = new Map(Array.from(this.dbSet.fieldMap.entries()).map(([key, value]) => [key, value.colName])) as Map<keyof T, string>;
    const eb = new exprBuilder.GroupExprBuilder<T>(fieldColumnMap);
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
   * @param {exprBuilder.types.IArrFieldFunc<exprBuilder.OrderExprBuilder<T>>} param
   * @returns {this}
   */
  orderBy(param: exprBuilder.types.IArrFieldFunc<exprBuilder.OrderExprBuilder<T>>): this {
    const fieldColumnMap = new Map(Array.from(this.dbSet.fieldMap.entries()).map(([key, value]) => [key, value.colName])) as Map<keyof T, string>;
    const eb = new exprBuilder.OrderExprBuilder<T>(fieldColumnMap);
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

  /**
   * Update Row
   *
   * @async
   * @param {T} entity
   * @param {...(keyof T)[]} updatedKeys
   * @returns {Promise<void>}
   */
  async update(entity: T, ...updatedKeys: (keyof T)[]): Promise<void> {
    this.stat.command = sql.types.Command.UPDATE;

    // Dynamic update
    let keys = Reflect.getMetadata(TABLE_COLUMN_KEYS, entity.constructor.prototype) as (keyof T)[];
    if (updatedKeys?.length) keys = keys.filter(key => updatedKeys.includes(key));

    const fields = keys.map(key => this.dbSet.fieldMap.get(key as string)).filter(a => a != null);
    if (fields.length == 0) throw new Error('Update Fields Empty');

    fields.forEach(field => {
      const c1 = new sql.Expression(field.colName);
      const c2 = new sql.Expression('?');
      const val = Reflect.get(entity, field.fieldName);
      c2.args.push(val);

      const expr = new sql.Expression(null, sql.types.Operator.Equal, c1, c2);
      this.stat.columns.push(expr);
    });

    await this.context.runStatement(this.stat);
  }

  /**
   * Delete Row
   *
   * @async
   * @returns {Promise<void>}
   */
  async delete(): Promise<void> {
    this.stat.command = sql.types.Command.DELETE;

    await this.context.runStatement(this.stat);
  }

  join<U extends object>(joinSet: IQuerySet<U>, param: IForeignFunc<exprBuilder.WhereExprBuilder<T>, exprBuilder.BaseExprBuilder<U>>, joinType?: sql.types.Join): JoinQuerySet<T, U> {
    joinType = joinType ?? sql.types.Join.InnerJoin;

    let temp: sql.Expression | null = null;
    if (param && param instanceof Function) {
      const mainFieldColumnMap = new Map(Array.from(this.columnFieldMap.entries()).map(([key, value]) => [value, key]));
      const mainObj = new exprBuilder.WhereExprBuilder<T>(mainFieldColumnMap);

      const joinFieldColumnMap = new Map(Array.from(joinSet.columnFieldMap.entries()).map(([key, value]) => [value, key]));
      const joinObj = new exprBuilder.BaseExprBuilder(joinFieldColumnMap);
      temp = param(mainObj, joinObj);
    }

    if (!(temp && temp instanceof sql.Expression && temp.exps.length > 0)) throw new Error('Invalid Join');

    const joinQuerySet = new JoinQuerySet(this.context, joinType, this, joinSet, temp);

    return joinQuerySet;
  }
}

export default QuerySet;
