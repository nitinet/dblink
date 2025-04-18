import { plainToInstance } from 'class-transformer';
import * as sql from 'dblink-core/src/sql/index.js';
import { IEntityType } from 'dblink-core/src/types.js';
import * as lodash from 'lodash-es';
import { Readable, Transform, TransformCallback } from 'node:stream';
import Context from '../Context.js';
import { TABLE_COLUMN_KEYS } from '../decorators/Constants.js';
import * as exprBuilder from '../exprBuilder/index.js';
import DBSet from './DBSet.js';
import IQuerySet from './IQuerySet.js';
import SelectQuerySet from './SelectQuerySet.js';

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
   * Alias
   *
   * @type {string}
   */
  alias: string;

  /**
   * Statement
   *
   * @type {*}
   */
  stat: sql.Statement = new sql.Statement(sql.types.Command.SELECT);

  /**
   * Select Keys
   *
   * @type {string[]}
   */
  selectKeys: string[];

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

    this.alias = this.dbSet.tableName.charAt(0);
    this.stat.collection.value = this.dbSet.tableName;
    this.stat.collection.alias = this.alias;

    this.selectKeys = Reflect.getMetadata(TABLE_COLUMN_KEYS, this.EntityType.prototype);
  }

  // getEntity() {
  // 	let res = new this.EntityType();
  // 	let keys: string[] = Reflect.getMetadata(TABLE_COLUMN_KEYS, this.EntityType.prototype);
  // 	keys.forEach(key => {
  // 		let field = Reflect.get(res, key);
  // 		if (field instanceof model.LinkObject || field instanceof model.LinkArray) {
  // 			field.bind(this.context, res);
  // 		}
  // 	});

  // 	return res;
  // }

  // Select Functions
  /**
   * Prepare select statement
   */
  prepareSelectStatement() {
    // Get all Columns
    const targetKeys: string[] = Reflect.getMetadata(TABLE_COLUMN_KEYS, this.EntityType.prototype);
    const fields = this.dbSet.getFieldMappingsByKeys(targetKeys);
    this.stat.columns = this.getColumnExprs(fields, this.alias);
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
    return result.rows.map(this.transformer.bind(this));
  }

  /**
   * Get total count of entity objects
   *
   * @async
   * @returns {Promise<number>}
   */
  async count(): Promise<number> {
    const countStmt = lodash.cloneDeep(this.stat);
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
  transformer(row: Record<string, unknown>): T {
    this.selectKeys.forEach(key => {
      const fieldMapping = this.dbSet.fieldMap.get(key);
      if (fieldMapping && key != fieldMapping.colName) {
        row[key] = row[fieldMapping.colName];
      }
    });
    const obj = plainToInstance(this.EntityType, row, { enableImplicitConversion: true, excludeExtraneousValues: true });
    this.selectKeys.forEach(key => {
      const field = Reflect.get(obj, key);
      if (field instanceof exprBuilder.LinkObject || field instanceof exprBuilder.LinkArray) {
        field.bind(this.context, obj);
      }
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
        transform: (chunk: Record<string, unknown>, encoding: BufferEncoding, callback: TransformCallback) => {
          callback(null, transformerFunc(chunk));
        }
      })
    );
  }

  /**
   * Get plain object list
   *
   * @async
   * @param {(keyof T)[]} keys
   * @returns {Promise<Partial<T>[]>}
   */
  async listPlain(keys: (keyof T)[]): Promise<Partial<T>[]> {
    const fields = this.dbSet.getFieldMappingsByKeys(<string[]>keys);
    this.stat.columns = this.getColumnExprs(fields, this.alias);

    const input = await this.context.runStatement(this.stat);
    const data = input.rows.map(row => {
      const obj: Partial<T> = {};
      fields.forEach(field => {
        const colName = field.colName;
        const val = row[colName] ?? row[colName.toLowerCase()] ?? row[colName.toUpperCase()];
        Reflect.set(obj, field.fieldName, val);
      });
      return obj;
    });
    return data;
  }

  /**
   * Get plain object list and total count
   *
   * @async
   * @param {(keyof T)[]} keys
   * @returns {Promise<{ count: number; values: Partial<T>[] }>}
   */
  async listPlainAndCount(keys: (keyof T)[]): Promise<{ count: number; values: Partial<T>[] }> {
    const values = await this.listPlain(keys);
    const count = await this.count();

    return { count, values };
  }

  // Selection Functions
  /**
   * Get Queryable Select object with custom Type
   *
   * @template {Object} U
   * @param {IEntityType<U>} EntityType
   * @returns {IQuerySet<U>}
   */
  select<U extends object>(EntityType: IEntityType<U>): IQuerySet<U> {
    const res = new SelectQuerySet(this.context, EntityType, this.dbSet);
    return res;
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
    const fieldMap = new Map<string | symbol, exprBuilder.FieldMapping>(Array.from(this.dbSet.fieldMap.entries()));
    const eb = new exprBuilder.WhereExprBuilder<T>(fieldMap);
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
    const fieldMap = new Map<string | symbol, exprBuilder.FieldMapping>(Array.from(this.dbSet.fieldMap.entries()));
    const eb = new exprBuilder.GroupExprBuilder<T>(fieldMap);
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
    const fieldMap = new Map<string | symbol, exprBuilder.FieldMapping>(Array.from(this.dbSet.fieldMap.entries()));
    const eb = new exprBuilder.OrderExprBuilder<T>(fieldMap);
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
    const keys: string[] = Reflect.getMetadata(TABLE_COLUMN_KEYS, entity.constructor.prototype);

    const fields = this.dbSet.getFieldMappingsByKeys(keys).filter(field => (<(string | symbol)[]>updatedKeys).includes(field.fieldName));
    if (fields.length == 0) throw new Error('Update Fields Empty');

    fields.forEach(field => {
      const c1 = new sql.Expression(field.colName);
      const c2 = new sql.Expression('?');
      const val = Reflect.get(entity, field.fieldName);
      c2.args.push(val);

      const expr = new sql.Expression(null, sql.types.Operator.Equal, c1, c2);
      this.stat.columns.push(expr);
    });

    const result = await this.context.runStatement(this.stat);
    if (result.error) throw result.error;
  }

  /**
   * Delete Row
   *
   * @async
   * @returns {Promise<void>}
   */
  async delete(): Promise<void> {
    this.stat.command = sql.types.Command.DELETE;

    const result = await this.context.runStatement(this.stat);
    if (result.error) throw result.error;
  }
}

export default QuerySet;
