import * as sql from 'dblink-core/src/sql/index.js';
import { IEntityType } from 'dblink-core/src/types.js';
import { Readable } from 'node:stream';
import * as decoratorKeys from '../decorators/Constants.js';
import * as exprBuilder from '../exprBuilder/index.js';
import * as types from '../exprBuilder/types.js';
import { OperandType } from '../exprBuilder/types.js';
import DBSet from './DBSet.js';
import IQuerySet from './IQuerySet.js';
import QuerySet from './QuerySet.js';
import SelectQuerySet from './SelectQuerySet.js';

/**
 * Table Set
 *
 * @class TableSet
 * @typedef {TableSet}
 * @template {Object} T
 * @extends {IQuerySet<T>}
 */
class TableSet<T extends object> extends IQuerySet<T> {
  /**
   * Entity Type
   *
   * @protected
   * @type {types.IEntityType<T>}
   */
  protected EntityType: IEntityType<T>;

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
   * @type {exprBuilder.FieldMapping[]}
   */
  private readonly primaryFields: exprBuilder.FieldMapping[] = [];

  /**
   * Creates an instance of TableSet.
   *
   * @constructor
   * @param {types.IEntityType<T>} EntityType
   */
  constructor(EntityType: IEntityType<T>) {
    super();
    this.EntityType = EntityType;
    this.dbSet = this.createDbSet();
  }

  /**
   * Get Entity Type
   *
   * @returns {types.IEntityType<T>}
   */
  getEntityType(): IEntityType<T> {
    return this.EntityType;
  }

  // getEntity() {
  // 	let obj = new this.EntityType();

  // 	let keys: string[] = Reflect.getMetadata(TABLE_COLUMN_KEYS, this.EntityType.prototype);
  // 	keys.forEach(key => {
  // 		let field = Reflect.get(obj, key);
  // 		if (field instanceof exprBuilder.LinkObject || field instanceof exprBuilder.LinkArray) {
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
    const tableName: string | null = Reflect.getMetadata(decoratorKeys.TABLE_KEY, this.EntityType);
    if (!tableName) throw new Error('Table Name Not Found');
    const dbSet = new DBSet(tableName);

    const keys: string[] = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);

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
    const columnName: string | null = Reflect.getMetadata(decoratorKeys.COLUMN_KEY, this.EntityType.prototype, key);
    if (columnName) {
      const dataType = Reflect.getMetadata('design:type', this.EntityType.prototype, key);
      const primaryKey = Reflect.getMetadata(decoratorKeys.ID_KEY, this.EntityType.prototype, key) === true;

      const fieldMapping = new exprBuilder.FieldMapping(key, columnName, dataType, primaryKey);
      dbSet.fieldMap.set(key, fieldMapping);

      if (primaryKey) this.primaryFields.push(fieldMapping);
    }
  }

  /**
   * Insert Row
   *
   * @async
   * @param {T} entity
   */
  async insert(entity: T): Promise<void> {
    const stat: sql.Statement = new sql.Statement(sql.types.Command.INSERT);
    stat.collection.value = this.dbSet.tableName;

    // Dynamic insert
    const keys: string[] = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
    const fields = this.dbSet.getFieldMappingsByKeys(keys);
    fields.forEach(field => {
      const val = Reflect.get(entity, field.fieldName);
      if (val == null) return;

      const col = new sql.Collection();
      col.value = field.colName;
      stat.columns.push(col);

      const expr = new sql.Expression('?');
      expr.args.push(this.context.handler.serializeValue(val, field.dataType));
      stat.values.push(expr);
    });

    await this.context.runStatement(stat);
  }

  /**
   * Insert Object and return synced from database
   *
   * @async
   * @param {T} entity
   * @returns {Promise<T>}
   */
  async insertAndFetch(entity: T): Promise<T> {
    const stat: sql.Statement = new sql.Statement(sql.types.Command.INSERT);
    stat.collection.value = this.dbSet.tableName;

    // Dynamic insert
    const keys: string[] = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
    const fields = this.dbSet.getFieldMappingsByKeys(keys);
    fields.forEach(field => {
      const val = Reflect.get(entity, field.fieldName);
      if (val == null) return;

      const col = new sql.Collection();
      col.value = field.colName;
      stat.columns.push(col);

      const expr = new sql.Expression('?');
      expr.args.push(this.context.handler.serializeValue(val, field.dataType));
      stat.values.push(expr);
    });

    this.primaryFields.forEach(field => {
      stat.returnColumns.push(new sql.Expression(field.colName));
    });

    const result = await this.context.runStatement(stat);

    if (result.rows.length == 1) {
      if (this.primaryFields.length == 1) {
        const id = result.rows[0].id as OperandType<T, keyof T>;
        return this.getOrThrow(id);
      } else {
        const row = result.rows[0];
        const idParams: OperandType<T, keyof T>[] = this.primaryFields.map(field => {
          return row[field.colName] as OperandType<T, keyof T>;
        });
        return this.getOrThrow(...idParams);
      }
    } else {
      const idParams: OperandType<T, keyof T>[] = this.primaryFields.map(field => {
        return Reflect.get(entity, field.fieldName);
      });
      return await this.getOrThrow(...idParams);
    }
  }

  /**
   * Insert Rows Bulk
   *
   * @async
   * @param {T[]} entities
   * @returns {Promise<void>}
   */
  async insertBulk(entities: T[]): Promise<void> {
    const stmts = entities.map(entity => {
      const stat: sql.Statement = new sql.Statement(sql.types.Command.INSERT);
      stat.collection.value = this.dbSet.tableName;

      // Dynamic insert
      const keys: string[] = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
      const fields = this.dbSet.getFieldMappingsByKeys(keys);
      fields.forEach(field => {
        const val = Reflect.get(entity, field.fieldName);
        if (val == null) return;

        const col = new sql.Collection();
        col.value = field.colName;
        stat.columns.push(col);

        const expr = new sql.Expression('?');
        expr.args.push(this.context.handler.serializeValue(val, field.dataType));
        stat.values.push(expr);
      });
      return stat;
    });

    await this.context.runStatement(stmts);
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

    const eb = new exprBuilder.WhereExprBuilder<T>(this.dbSet.fieldMap);
    let expr = new sql.Expression();
    this.primaryFields.forEach(pri => {
      const val = Reflect.get(entity, pri.fieldName);
      expr = expr.add(eb.eq(<types.KeyOf<T>>pri.fieldName, this.context.handler.serializeValue(val, pri.dataType) as OperandType<T, keyof T>));
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
    const stat = new sql.Statement(sql.types.Command.UPDATE);
    stat.collection.value = this.dbSet.tableName;

    // Dynamic update
    const keys: string[] = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
    let fields = this.dbSet.getFieldMappingsByKeys(keys).filter(field => !this.primaryFields.some(pri => pri.fieldName == field.fieldName));
    if (updatedKeys) fields = fields.filter(field => (<(string | symbol)[]>updatedKeys).includes(field.fieldName));
    if (fields.length == 0) throw new Error('Update Fields Empty');

    fields.forEach(field => {
      const c1 = new sql.Expression(field.colName);
      const c2 = new sql.Expression('?');
      const val = Reflect.get(entity, field.fieldName);
      c2.args.push(this.context.handler.serializeValue(val, field.dataType));

      const expr = new sql.Expression(null, sql.types.Operator.Equal, c1, c2);
      stat.columns.push(expr);
    });

    stat.where = this.whereExpr(entity);

    const result = await this.context.runStatement(stat);
    if (result.error) {
      throw new Error(result.error);
    } else {
      const idParams: OperandType<T, keyof T>[] = [];
      this.primaryFields.forEach(field => {
        idParams.push(Reflect.get(entity, field.fieldName));
      });
      const finalObj = await this.get(...idParams);
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
    const keys: string[] = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
    let fields = this.dbSet.getFieldMappingsByKeys(keys).filter(field => !this.primaryFields.some(pri => pri.fieldName == field.fieldName));
    if (updatedKeys) fields = fields.filter(field => (<(string | symbol)[]>updatedKeys).includes(field.fieldName));

    const stmts = entities.map(entity => {
      const stat = new sql.Statement(sql.types.Command.UPDATE);
      stat.collection.value = this.dbSet.tableName;

      fields.forEach(field => {
        const c1 = new sql.Expression(field.colName);
        const c2 = new sql.Expression('?');
        const val = Reflect.get(entity, field.fieldName);
        c2.args.push(this.context.handler.serializeValue(val, field.dataType));

        const expr = new sql.Expression(null, sql.types.Operator.Equal, c1, c2);
        stat.columns.push(expr);
      });

      stat.where = this.whereExpr(entity);
      return stat;
    });

    await this.context.runStatement(stmts);
  }

  /**
   * Insert or Update row
   *
   * @async
   * @param {T} entity
   * @returns {Promise<T>}
   */
  async upsert(entity: T): Promise<T> {
    const idParams: OperandType<T, keyof T>[] = [];
    this.primaryFields.forEach(field => {
      idParams.push(Reflect.get(entity, field.fieldName));
    });
    const obj = await this.get(...idParams);

    if (obj) {
      return this.update(entity);
    } else {
      return this.insertAndFetch(entity);
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
    const stat = new sql.Statement(sql.types.Command.DELETE);
    stat.collection.value = this.dbSet.tableName;

    stat.where = this.whereExpr(entity);
    await this.context.runStatement(stat);
  }

  /**
   * Delete Rows Bulk
   *
   * @async
   * @param {T[]} entities
   * @returns {Promise<void>}
   */
  async deleteBulk(entities: T[]): Promise<void> {
    const stmts = entities.map(entity => {
      const stat = new sql.Statement(sql.types.Command.DELETE);
      stat.collection.value = this.dbSet.tableName;

      stat.where = this.whereExpr(entity);
      return stat;
    });
    await this.context.runStatement(stmts);
  }

  /**
   * Get Row Object
   *
   * @async
   * @param {...any[]} idParams
   * @returns {Promise<T | null>}
   */
  async get(...idParams: OperandType<T, keyof T>[]): Promise<T | null> {
    if (idParams == null) throw new Error('Id parameter cannot be null');

    if (this.primaryFields.length == 0) {
      throw new Error(`No Primary Field Found in Table: ${this.dbSet.tableName}`);
    } else if (this.primaryFields.length != idParams.length) {
      throw new Error('Invalid Arguments Length');
    } else {
      return this.where(a => {
        let expr = new sql.Expression();
        this.primaryFields.forEach((pri, idx) => {
          expr = expr.add(a.eq(<types.KeyOf<T>>pri.fieldName, this.context.handler.serializeValue(idParams[idx], pri.dataType) as OperandType<T, keyof T>));
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
  async getOrThrow(...idParams: OperandType<T, keyof T>[]): Promise<T> {
    const val = await this.get(...idParams);
    if (!val) throw new Error('Value Not Found');
    return val;
  }

  /**
   * Function to generate Where clause
   *
   * @param {types.IWhereFunc<exprBuilder.WhereExprBuilder<T>>} param
   * @param {...any[]} args
   * @returns {QuerySet<T>}
   */
  where(param: types.IWhereFunc<exprBuilder.WhereExprBuilder<T>>, ...args: unknown[]): QuerySet<T> {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.where(param, args);
  }

  /**
   * Function to generate Group By clause
   *
   * @param {types.IArrFieldFunc<exprBuilder.GroupExprBuilder<T>>} func
   * @returns {QuerySet<T>}
   */
  groupBy(func: types.IArrFieldFunc<exprBuilder.GroupExprBuilder<T>>): QuerySet<T> {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.groupBy(func);
  }

  /**
   * Function to generate Order By clause
   *
   * @param {types.IArrFieldFunc<exprBuilder.OrderExprBuilder<T>>} func
   * @returns {QuerySet<T>}
   */
  orderBy(func: types.IArrFieldFunc<exprBuilder.OrderExprBuilder<T>>): QuerySet<T> {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
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
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.limit(size, index);
  }

  /**
   * Get entity object list
   *
   * @returns {Promise<T[]>}
   */
  list(): Promise<T[]> {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.list();
  }

  /**
   * Get total count of entity objects
   *
   * @returns {Promise<number>}
   */
  count(): Promise<number> {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.count();
  }

  /**
   * Get entity objects list and total count
   *
   * @returns {Promise<{ count: number; values: T[] }>}
   */
  listAndCount(): Promise<{ count: number; values: T[] }> {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.listAndCount();
  }

  /**
   * Get stream of Entity objects
   *
   * @returns {Promise<Readable>}
   */
  stream(): Promise<Readable> {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.stream();
  }

  /**
   * Get plain object list
   *
   * @param {(keyof T)[]} keys
   * @returns {Promise<Partial<T>[]>}
   */
  listPlain(keys: (keyof T)[]): Promise<Partial<T>[]> {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.listPlain(keys);
  }

  /**
   * Get plain object list and total count
   *
   * @param {(keyof T)[]} keys
   * @returns {Promise<{ count: number; values: Partial<T>[] }>}
   */
  listPlainAndCount(keys: (keyof T)[]): Promise<{ count: number; values: Partial<T>[] }> {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.listPlainAndCount(keys);
  }

  /**
   * Get Queryable Select object with custom Type
   *
   * @template {Object} U
   * @param {types.IEntityType<U>} EntityType
   * @returns {SelectQuerySet<U>}
   */
  select<U extends object>(EntityType: IEntityType<U>): SelectQuerySet<U> {
    const res = new SelectQuerySet(this.context, EntityType, this.dbSet);
    return res;
  }
}

export default TableSet;
