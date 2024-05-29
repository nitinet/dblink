import * as sql from 'dblink-core/lib/sql/index.js';

import * as decoratorKeys from '../decorators/Constants.js';
import * as model from '../exprBuilder/index.js';
import * as types from '../exprBuilder/types.js';
import DBSet from './DBSet.js';
import IQuerySet from './IQuerySet.js';
import QuerySet from './QuerySet.js';
import SelectQuerySet from './SelectQuerySet.js';
import { Readable } from 'node:stream';

/**
 * Table Set
 *
 * @class TableSet
 * @typedef {TableSet}
 * @template {Object} T
 * @extends {IQuerySet<T>}
 */
class TableSet<T extends Object> extends IQuerySet<T> {
  /**
   * Entity Type
   *
   * @protected
   * @type {types.IEntityType<T>}
   */
  protected EntityType: types.IEntityType<T>;

  /**
   * Db Set linked to database table
   *
   * @type {DBSet}
   */
  dbSet: DBSet;

  /**
   * Primary key fields
   *
   * @private
   * @type {model.FieldMapping[]}
   */
  private primaryFields: model.FieldMapping[] = [];

  /**
   * Creates an instance of TableSet.
   *
   * @constructor
   * @param {types.IEntityType<T>} EntityType
   */
  constructor(EntityType: types.IEntityType<T>) {
    super();
    this.EntityType = EntityType;
    this.dbSet = this.createDbSet();
  }

  /**
   * Get Entity Type
   *
   * @returns {types.IEntityType<T>}
   */
  getEntityType(): types.IEntityType<T> {
    return this.EntityType;
  }

  // getEntity() {
  // 	let obj = new this.EntityType();

  // 	let keys: string[] = Reflect.getMetadata(TABLE_COLUMN_KEYS, this.EntityType.prototype);
  // 	keys.forEach(key => {
  // 		let field = Reflect.get(obj, key);
  // 		if (field instanceof model.LinkObject || field instanceof model.LinkArray) {
  // 			field.bind(this.context, obj);
  // 		}
  // 	});
  // 	return obj;
  // }

  /**
   * Create DbSet
   *
   * @private
   * @returns {DBSet}
   */
  private createDbSet(): DBSet {
    let tableName: string | null = Reflect.getMetadata(decoratorKeys.TABLE_KEY, this.EntityType);
    if (!tableName) throw new Error('Table Name Not Found');
    let dbSet = new DBSet(tableName);

    let keys: string[] = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);

    // Bind Fields
    keys.forEach(key => this.bindDbSetField(dbSet, key));
    return dbSet;
  }

  /**
   * Bind DbSet fields
   *
   * @private
   * @param {DBSet} dbSet
   * @param {string} key
   */
  private bindDbSetField(dbSet: DBSet, key: string) {
    let columnName: string | null = Reflect.getMetadata(decoratorKeys.COLUMN_KEY, this.EntityType.prototype, key);
    if (columnName) {
      let columnType = Reflect.getMetadata('design:type', this.EntityType.prototype, key);
      let primaryKey = Reflect.getMetadata(decoratorKeys.ID_KEY, this.EntityType.prototype, key) === true;

      let fieldMapping = new model.FieldMapping(key, columnName, columnType, primaryKey);
      dbSet.fieldMap.set(key, fieldMapping);

      if (primaryKey) this.primaryFields.push(fieldMapping);
    }
  }

  /**
   * Insert Row
   *
   * @async
   * @param {T} entity
   * @returns {Promise<T>}
   */
  async insert(entity: T): Promise<T> {
    let stat: sql.Statement = new sql.Statement(sql.types.Command.INSERT);
    stat.collection.value = this.dbSet.tableName;

    // Dynamic insert
    let keys: string[] = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
    let fields = this.dbSet.filterFields(keys);
    fields.forEach(field => {
      let val = Reflect.get(entity, field.fieldName);
      if (val == null) return;

      let col = new sql.Collection();
      col.value = field.colName;
      stat.columns.push(col);

      let expr = new sql.Expression('?');
      expr.args.push(val);
      stat.values.push(expr);
    });

    let result = await this.context.executeStatement(stat);

    let finalObj: T | null = null;
    if (this.primaryFields.length == 1) {
      let primaryField = this.primaryFields[0];
      let id = result.id ?? Reflect.get(entity, primaryField.fieldName);
      finalObj = await this.get(id);
    } else {
      let idParams: any[] = [];
      this.primaryFields.forEach(field => {
        idParams.push(Reflect.get(entity, field.fieldName));
      });
      finalObj = await this.get(...idParams);
    }
    if (!finalObj) throw new Error('Insert Object Not Found');
    return finalObj;
  }

  /**
   * Insert Rows Bulk
   *
   * @async
   * @param {T[]} entities
   * @returns {Promise<void>}
   */
  async insertBulk(entities: T[]): Promise<void> {
    let stmts = entities.map(entity => {
      let stat: sql.Statement = new sql.Statement(sql.types.Command.INSERT);
      stat.collection.value = this.dbSet.tableName;

      // Dynamic insert
      let keys: string[] = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
      let fields = this.dbSet.filterFields(keys);
      fields.forEach(field => {
        let val = Reflect.get(entity, field.fieldName);
        if (val == null) return;

        let col = new sql.Collection();
        col.value = field.colName;
        stat.columns.push(col);

        let expr = new sql.Expression('?');
        expr.args.push(val);
        stat.values.push(expr);
      });
      return stat;
    });

    await this.context.executeStatement(stmts);
  }

  /**
   * Create Where Expression
   *
   * @private
   * @param {T} entity
   * @returns {sql.Expression}
   */
  private whereExpr(entity: T): sql.Expression {
    if (!this.primaryFields?.length) {
      throw new Error('Primary Key fields not found');
    }

    let eb = new model.WhereExprBuilder<T>(this.dbSet.fieldMap);
    let expr = new sql.Expression();
    this.primaryFields.forEach((pri, idx) => {
      let temp: any = Reflect.get(entity, pri.fieldName);
      expr = expr.add(eb.eq(<types.KeyOf<T>>pri.fieldName, temp));
    });
    return expr;
  }

  /**
   * Update Row
   *
   * @async
   * @param {T} entity
   * @param {...(keyof T)[]} updatedKeys
   * @returns {Promise<T>}
   */
  async update(entity: T, ...updatedKeys: (keyof T)[]): Promise<T> {
    let stat = new sql.Statement(sql.types.Command.UPDATE);
    stat.collection.value = this.dbSet.tableName;

    // Dynamic update
    let keys: string[] = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
    let fields = this.dbSet.filterFields(keys).filter(field => !this.primaryFields.some(pri => pri.fieldName == field.fieldName));
    if (updatedKeys) fields = fields.filter(field => (<(string | symbol)[]>updatedKeys).includes(field.fieldName));
    if (fields.length == 0) throw new Error('Update Fields Empty');

    fields.forEach(field => {
      let c1 = new sql.Expression(field.colName);
      let c2 = new sql.Expression('?');
      let val = Reflect.get(entity, field.fieldName);
      c2.args.push(val);

      let expr = new sql.Expression(null, sql.types.Operator.Equal, c1, c2);
      stat.columns.push(expr);
    });

    stat.where = this.whereExpr(entity);

    let result = await this.context.executeStatement(stat);
    if (result.error) {
      throw new Error(result.error);
    } else {
      let idParams: any[] = [];
      this.primaryFields.forEach(field => {
        idParams.push(Reflect.get(entity, field.fieldName));
      });
      let finalObj = await this.get(...idParams);
      if (!finalObj) throw new Error('Update Object Not Found');
      return finalObj;
    }
  }

  /**
   * Update Rows Bulk
   *
   * @async
   * @param {T[]} entities
   * @param {...(keyof T)[]} updatedKeys
   * @returns {Promise<void>}
   */
  async updateBulk(entities: T[], ...updatedKeys: (keyof T)[]): Promise<void> {
    let keys: string[] = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
    let fields = this.dbSet.filterFields(keys).filter(field => !this.primaryFields.some(pri => pri.fieldName == field.fieldName));
    if (updatedKeys) fields = fields.filter(field => (<(string | symbol)[]>updatedKeys).includes(field.fieldName));

    let stmts = entities.map(entity => {
      let stat = new sql.Statement(sql.types.Command.UPDATE);
      stat.collection.value = this.dbSet.tableName;

      fields.forEach(field => {
        let c1 = new sql.Expression(field.colName);
        let c2 = new sql.Expression('?');
        let val = Reflect.get(entity, field.fieldName);
        c2.args.push(val);

        let expr = new sql.Expression(null, sql.types.Operator.Equal, c1, c2);
        stat.columns.push(expr);
      });

      stat.where = this.whereExpr(entity);
      return stat;
    });

    await this.context.executeStatement(stmts);
  }

  /**
   * Insert or Update row
   *
   * @async
   * @param {T} entity
   * @returns {Promise<T>}
   */
  async upsert(entity: T): Promise<T> {
    let idParams: any[] = [];
    this.primaryFields.forEach(field => {
      idParams.push(Reflect.get(entity, field.fieldName));
    });
    let obj = await this.get(...idParams);

    if (obj) {
      return this.update(entity);
    } else {
      return this.insert(entity);
    }
  }

  /**
   * Delete row
   *
   * @async
   * @param {T} entity
   * @returns {Promise<void>}
   */
  async delete(entity: T): Promise<void> {
    let stat = new sql.Statement(sql.types.Command.DELETE);
    stat.collection.value = this.dbSet.tableName;

    stat.where = this.whereExpr(entity);
    await this.context.executeStatement(stat);
  }

  /**
   * Delete Rows Bulk
   *
   * @async
   * @param {T[]} entities
   * @returns {Promise<void>}
   */
  async deleteBulk(entities: T[]): Promise<void> {
    let stmts = entities.map(entity => {
      let stat = new sql.Statement(sql.types.Command.DELETE);
      stat.collection.value = this.dbSet.tableName;

      stat.where = this.whereExpr(entity);
      return stat;
    });
    await this.context.executeStatement(stmts);
  }

  /**
   * Get Row Object
   *
   * @async
   * @param {...any[]} idParams
   * @returns {Promise<T | null>}
   */
  async get(...idParams: any[]): Promise<T | null> {
    if (idParams == null) throw new Error('Id parameter cannot be null');

    if (this.primaryFields.length == 0) {
      throw new Error(`No Primary Field Found in Table: ${this.dbSet.tableName}`);
    } else if (this.primaryFields.length != idParams.length) {
      throw new Error('Invalid Arguments Length');
    } else {
      return this.where(a => {
        let expr = new sql.Expression();
        this.primaryFields.forEach((pri, idx) => {
          expr = expr.add(a.eq(<types.KeyOf<T>>pri.fieldName, idParams[idx]));
        });
        return expr;
      }).single();
    }
  }

  /**
   * Get Row Object or throws
   *
   * @async
   * @param {...any[]} idParams
   * @returns {Promise<T>}
   */
  async getOrThrow(...idParams: any[]): Promise<T> {
    let val = await this.get(idParams);
    if (!val) throw new Error('Value Not Found');
    return val;
  }

  /**
   * Function to generate Where clause
   *
   * @param {types.IWhereFunc<model.WhereExprBuilder<T>>} param
   * @param {...any[]} args
   * @returns {QuerySet<T>}
   */
  where(param: types.IWhereFunc<model.WhereExprBuilder<T>>, ...args: any[]): QuerySet<T> {
    let q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.where(param, args);
  }

  /**
   * Function to generate Group By clause
   *
   * @param {types.IArrFieldFunc<model.GroupExprBuilder<T>>} func
   * @returns {QuerySet<T>}
   */
  groupBy(func: types.IArrFieldFunc<model.GroupExprBuilder<T>>): QuerySet<T> {
    let q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.groupBy(func);
  }

  /**
   * Function to generate Order By clause
   *
   * @param {types.IArrFieldFunc<model.OrderExprBuilder<T>>} func
   * @returns {QuerySet<T>}
   */
  orderBy(func: types.IArrFieldFunc<model.OrderExprBuilder<T>>): QuerySet<T> {
    let q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.orderBy(func);
  }

  /**
   * Function to generate Limit clause
   *
   * @param {number} size
   * @param {?number} [index]
   * @returns {QuerySet<T>}
   */
  limit(size: number, index?: number): QuerySet<T> {
    let q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.limit(size, index);
  }

  /**
   * Get entity object list
   *
   * @returns {Promise<T[]>}
   */
  list(): Promise<T[]> {
    let q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.list();
  }

  /**
   * Get total count of entity objects
   *
   * @returns {Promise<number>}
   */
  count(): Promise<number> {
    let q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.count();
  }

  /**
   * Get entity objects list and total count
   *
   * @returns {Promise<{ count: number; values: T[] }>}
   */
  listAndCount(): Promise<{ count: number; values: T[] }> {
    let q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.listAndCount();
  }

  /**
   * Get stream of Entity objects
   *
   * @returns {Promise<Readable>}
   */
  stream(): Promise<Readable> {
    let q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.stream();
  }

  /**
   * Get plain object list
   *
   * @param {(keyof T)[]} keys
   * @returns {Promise<Partial<T>[]>}
   */
  listPlain(keys: (keyof T)[]): Promise<Partial<T>[]> {
    let q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.listPlain(keys);
  }

  /**
   * Get plain object list and total count
   *
   * @param {(keyof T)[]} keys
   * @returns {Promise<{ count: number; values: Partial<T>[] }>}
   */
  listPlainAndCount(keys: (keyof T)[]): Promise<{ count: number; values: Partial<T>[] }> {
    let q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.listPlainAndCount(keys);
  }

  /**
   * Get Queryable Select object with custom Type
   *
   * @template {Object} U
   * @param {types.IEntityType<U>} EntityType
   * @returns {SelectQuerySet<U>}
   */
  select<U extends Object>(EntityType: types.IEntityType<U>): SelectQuerySet<U> {
    let res = new SelectQuerySet(this.context, EntityType, this.dbSet);
    return res;
  }

  // join<A extends Object>(coll: IQuerySet<A>, param: types.IJoinFunc<model.WhereExprBuilder<T>, model.GroupExprBuilder<A>>, joinType?: sql.types.Join) {
  // 	let q = new QuerySet(this.context, this.dbSet);
  // 	return q.join(coll, param, joinType);
  // }
}

export default TableSet;
