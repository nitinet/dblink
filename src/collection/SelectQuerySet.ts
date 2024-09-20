import * as sql from 'dblink-core/src/sql/index.js';
import * as lodash from 'lodash-es';
import { Readable, Transform, TransformCallback } from 'node:stream';
import Context from '../Context.js';
import * as exprBuilder from '../exprBuilder/index.js';
import DBSet from './DBSet.js';
import IQuerySet from './IQuerySet.js';

/**
 * SelectQuerySet
 */
class SelectQuerySet<T extends object> extends IQuerySet<T> {
  /**
   * Db Set linked to database table
   *
   * @protected
   * @type {DBSet}
   */
  protected dbSet: DBSet;

  /**
   * Entity Type
   *
   * @protected
   * @type {exprBuilder.types.IEntityType<T>}
   */
  protected EntityType: exprBuilder.types.IEntityType<T>;

  /**
   * Alias
   *
   * @type {(string | null)}
   */
  alias: string | null;

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
   * Creates an instance of SelectQuerySet.
   *
   * @constructor
   * @param {Context} context
   * @param {exprBuilder.types.IEntityType<T>} EntityType
   * @param {DBSet} dbSet
   */
  constructor(context: Context, EntityType: exprBuilder.types.IEntityType<T>, dbSet: DBSet) {
    super();

    this.context = context;
    this.EntityType = EntityType;
    this.dbSet = dbSet;

    this.alias = dbSet.tableName.charAt(0);
    this.stat.collection.value = dbSet.tableName;
    this.stat.collection.alias = this.alias;

    const temp = new this.EntityType();
    this.selectKeys = <string[]>Reflect.ownKeys(temp);
  }

  // Selection Functions
  /**
   * Prepare select statement
   */
  prepareSelectStatement() {
    // Get all Columns
    const temp = new this.EntityType();
    const targetKeys = <string[]>Reflect.ownKeys(temp);
    const fields = this.dbSet.getFieldMappingsByKeys(targetKeys);
    this.stat.columns = this.getColumnExprs(fields, this.alias ?? undefined);
  }

  /**
   * get entity object list
   *
   * @async
   * @returns {Promise<T[]>}
   */
  async list(): Promise<T[]> {
    this.prepareSelectStatement();
    const result = await this.context.executeStatement(this.stat);
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
    const countResult = await this.context.executeStatement(countStmt);
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
    const obj = new this.EntityType();
    this.selectKeys.forEach(key => {
      const fieldMapping = this.dbSet.fieldMap.get(key);
      if (fieldMapping) {
        const colName = fieldMapping.colName;
        const val = row[colName];
        Reflect.set(obj, key, val);
      } else {
        const field = Reflect.get(obj, key);
        if (field instanceof exprBuilder.LinkObject || field instanceof exprBuilder.LinkArray) {
          field.bind(this.context, obj);
        }
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
    this.stat.columns = this.getColumnExprs(fields, this.alias ?? undefined);

    const input = await this.context.executeStatement(this.stat);
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
   * @param {exprBuilder.types.IEntityType<U>} EntityType
   * @returns {IQuerySet<U>}
   */
  select<U extends object>(EntityType: exprBuilder.types.IEntityType<U>): IQuerySet<U> {
    const keys = Reflect.ownKeys(new this.EntityType());
    const cols = Array.from(this.dbSet.fieldMap.entries()).filter(a => keys.includes(a[0]));

    const newDbSet = new DBSet('');
    newDbSet.fieldMap = new Map(cols);

    const res = new SelectQuerySet(this.context, EntityType, newDbSet);
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
    const fieldMap = new Map(Array.from(this.dbSet.fieldMap));
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
    const fieldMap = new Map(Array.from(this.dbSet.fieldMap));
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
    const fieldMap = new Map(Array.from(this.dbSet.fieldMap));
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

  // join<A extends Object>(coll: IQuerySet<A>, param: types.IJoinFunc<model.WhereExprBuilder<T>, model.GroupExprBuilder<A>>, joinType?: sql.types.Join): IQuerySet<T & A> {
  // 	joinType = joinType ?? sql.types.Join.InnerJoin;

  // 	let temp: sql.Expression | null = null;
  // 	if (param && param instanceof Function) {
  // 		let mainObj = new model.WhereExprBuilder<T>(this.dbSet.fieldMap);
  // 		let joinObj = new model.GroupExprBuilder(coll.) coll.getEntity();
  // 		temp = param(mainObj, joinObj);
  // 	}

  // 	if (!(temp && temp instanceof sql.Expression && temp.exps.length > 0))
  // 		throw new Error('Invalid Join');

  // 	return new JoinQuerySet<T, A>(this, coll, joinType, temp);
  // }
}

export default SelectQuerySet;
