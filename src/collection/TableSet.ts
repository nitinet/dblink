import * as sql from 'dblink-core/src/sql/index.js';
import { IEntityType } from 'dblink-core/src/types.js';
import { Readable } from 'node:stream';
import * as decoratorKeys from '../decorators/Constants.js';
import * as exprBuilder from '../exprBuilder/index.js';
import * as types from '../exprBuilder/types.js';
import { OperandType } from '../exprBuilder/types.js';
import DBSet from './DBSet.js';
import IQuerySet, { ColumnInfo } from './IQuerySet.js';
import JoinQuerySet from './JoinQuerySet.js';
import QuerySet from './QuerySet.js';

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
    this.stat.collection.value = this.dbSet.tableName;
    this.stat.collection.alias = this.dbSet.tableName.charAt(0);
  }

  /**
   * Get Entity Type
   *
   * @returns {types.IEntityType<T>}
   */
  getEntityType(): IEntityType<T> {
    return this.EntityType;
  }

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

    const fields = this.getAllFields();

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

    const fields = this.getAllFields();

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
        const id = result.rows[0][this.primaryFields[0].colName] as OperandType<T, keyof T>;
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
   * Insert Rows Bulk with a single multi-row INSERT (one round trip).
   * A column that is null in every row is left out of the statement; otherwise a null in a row becomes `default`.
   *
   * Runs on the table's own context, so inside a transaction it joins that transaction.
   * ponytail: single statement; Postgres caps bind params at 65535 (rows x columns) - chunk if a caller ever needs more.
   *
   * @async
   * @param {T[]} entities
   * @returns {Promise<void>}
   */
  async insertBulk(entities: T[]): Promise<void> {
    if (!entities.length) return;

    const fields = this.getAllFields().filter(field => entities.some(entity => Reflect.get(entity, field.fieldName) != null));
    if (!fields.length) throw new Error('No column values to insert');

    const stat: sql.Statement = new sql.Statement(sql.types.Command.INSERT);
    stat.collection.value = this.dbSet.tableName;
    fields.forEach(field => {
      const col = new sql.Collection();
      col.value = field.colName;
      stat.columns.push(col);
    });

    const args: unknown[] = [];
    const tuples = entities.map(entity =>
      fields
        .map(field => {
          const val = Reflect.get(entity, field.fieldName);
          if (val == null) return 'default';
          args.push(this.context.handler.serializeValue(val, field.dataType));
          return '?';
        })
        .join(', ')
    );

    // insertQuery wraps the single value expression in `values (...)`, so the row tuples join with `), (`.
    const expr = new sql.Expression(tuples.join('), ('));
    expr.args = args;
    stat.values.push(expr);

    await this.context.runStatement(stat);
  }

  /**
   * Where Expression matching ANY of the given primary keys (already serialized, in primary-field order):
   * `pk in (?, ?)` for a single-column key, `(a = ? and b = ?) or (...)` for a composite one.
   *
   * @private
   * @param {unknown[][]} keys
   * @returns {sql.Expression}
   */
  private whereAnyKey(keys: unknown[][]): sql.Expression {
    const matchKey = this.primaryFields.map(pri => `${pri.colName} = ?`).join(' and ');
    const where =
      this.primaryFields.length == 1 ? new sql.Expression(`${this.primaryFields[0].colName} in (${keys.map(() => '?').join(', ')})`) : new sql.Expression(keys.map(() => `(${matchKey})`).join(' or '));
    keys.forEach(rowKeys => where.args.push(...rowKeys));
    return where;
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

    const fieldColumnMap = this.getFieldColumnMap();
    const eb = new exprBuilder.WhereExprBuilder<T>(fieldColumnMap);
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

    const fields = this.getUpdateFields(updatedKeys);

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

    await this.context.runStatement(stat);

    const idParams: OperandType<T, keyof T>[] = this.primaryFields.map(field => Reflect.get(entity, field.fieldName));
    const finalObj = await this.get(...idParams);
    if (!finalObj) throw new Error('Update Object Not Found');
    return finalObj;
  }

  /**
   * Update Rows Bulk - every entity's `updatedKeys` (matched by primary key) in ONE statement:
   * `update t set c = case when <pk> then ? ... else c end where <pk> or <pk> ...`. Plain ANSI SQL, so every
   * handler runs it and no raw SQL is needed in callers. The previous form joined one UPDATE per entity with `;`,
   * which Postgres rejects for a parameterised query ("cannot insert multiple commands into a prepared statement").
   * If an entity appears twice the last one wins, as it did when the updates ran in sequence. The `else` keeps the
   * current value; it is also what lets Postgres type the bound values from the column.
   * ponytail: single statement; Postgres caps bind params at 65535 (about rows x (keys x (columns + 1) + columns)) -
   * chunk if a caller ever needs more.
   *
   * @async
   * @param {T[]} entities
   * @param {...(keyof T)[]} updatedKeys
   * @returns {Promise<void>}
   */
  async updateBulk(entities: T[], ...updatedKeys: (keyof T)[]): Promise<void> {
    if (!entities.length) return;
    if (!this.primaryFields?.length) throw new Error('Primary Key fields not found');

    const fields = this.getUpdateFields(updatedKeys);
    if (fields.length == 0) throw new Error('Update Fields Empty');

    const handler = this.context.handler;
    const rows = new Map<string, { keys: unknown[]; entity: T }>();
    entities.forEach(entity => {
      const keys = this.primaryFields.map(pri => handler.serializeValue(Reflect.get(entity, pri.fieldName), pri.dataType));
      rows.set(JSON.stringify(keys), { keys, entity });
    });
    const batch = [...rows.values()];

    const matchKey = this.primaryFields.map(pri => `${pri.colName} = ?`).join(' and ');
    const stat = new sql.Statement(sql.types.Command.UPDATE);
    stat.collection.value = this.dbSet.tableName;

    fields.forEach(field => {
      const expr = new sql.Expression(`${field.colName} = case ${batch.map(() => `when ${matchKey} then ?`).join(' ')} else ${field.colName} end`);
      batch.forEach(({ keys, entity }) => expr.args.push(...keys, handler.serializeValue(Reflect.get(entity, field.fieldName), field.dataType)));
      stat.columns.push(expr);
    });

    stat.where = this.whereAnyKey(batch.map(({ keys }) => keys));

    await this.context.runStatement(stat);
  }

  /**
   * Insert or Update row
   *
   * @async
   * @param {T} entity
   * @returns {Promise<T>}
   */
  async upsert(entity: T): Promise<T> {
    const idParams: OperandType<T, keyof T>[] = this.primaryFields.map(field => Reflect.get(entity, field.fieldName));
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
   * Delete Rows Bulk - every entity (matched by primary key) in ONE statement: `delete from t where <pk> or <pk> ...`.
   * The previous form joined one DELETE per entity with `;`, which Postgres rejects for a parameterised query
   * ("cannot insert multiple commands into a prepared statement") as soon as there is more than one row.
   * ponytail: single statement; Postgres caps bind params at 65535 (rows x key columns) - chunk if a caller ever needs more.
   *
   * @async
   * @param {T[]} entities
   * @returns {Promise<void>}
   */
  async deleteBulk(entities: T[]): Promise<void> {
    if (!entities.length) return;
    if (!this.primaryFields?.length) throw new Error('Primary Key fields not found');

    const stat = new sql.Statement(sql.types.Command.DELETE);
    stat.collection.value = this.dbSet.tableName;
    stat.where = this.whereAnyKey(entities.map(entity => this.primaryFields.map(pri => this.context.handler.serializeValue(Reflect.get(entity, pri.fieldName), pri.dataType))));

    await this.context.runStatement(stat);
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
    return this.createQuerySet().where(param, args);
  }

  /**
   * Function to generate Group By clause
   *
   * @param {types.IArrFieldFunc<exprBuilder.GroupExprBuilder<T>>} func
   * @returns {QuerySet<T>}
   */
  groupBy(func: types.IArrFieldFunc<exprBuilder.GroupExprBuilder<T>>): QuerySet<T> {
    return this.createQuerySet().groupBy(func);
  }

  /**
   * Function to generate Order By clause
   *
   * @param {types.IArrFieldFunc<exprBuilder.OrderExprBuilder<T>>} func
   * @returns {QuerySet<T>}
   */
  orderBy(func: types.IArrFieldFunc<exprBuilder.OrderExprBuilder<T>>): QuerySet<T> {
    return this.createQuerySet().orderBy(func);
  }

  initColumnFieldMap(): void {
    if (this.columnFieldMap.size !== 0) return;

    const fields = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype) as (keyof T)[];
    fields.forEach(field => {
      const fieldMapping = this.dbSet.fieldMap.get(field as string);
      if (fieldMapping) {
        this.columnFieldMap.set(fieldMapping.colName, field);
      }
    });
  }
  getColumnInfo(): ColumnInfo<T>[] {
    return this.createQuerySet().getColumnInfo();
  }

  /**
   * Helper to create a new QuerySet instance
   */
  private createQuerySet(): QuerySet<T> {
    return new QuerySet(this.context, this.EntityType, this.dbSet);
  }

  /**
   * Helper to get field-to-column map
   */
  private getFieldColumnMap(): Map<keyof T, string> {
    return new Map(Array.from(this.dbSet.fieldMap.entries()).map(([key, value]) => [key, value.colName])) as Map<keyof T, string>;
  }

  /**
   * Helper to get all field mappings (cached via dbSet.fieldMap)
   */
  private getAllFields(): exprBuilder.FieldMapping[] {
    const keys: string[] = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
    return keys.map(key => this.dbSet.fieldMap.get(key as string)).filter(a => a != null);
  }

  /**
   * Helper to get update fields (non-primary fields)
   */
  private getUpdateFields(updatedKeys?: (keyof T)[]): exprBuilder.FieldMapping[] {
    let keys = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype) as (keyof T)[];
    if (updatedKeys?.length) keys = keys.filter(key => updatedKeys.includes(key));

    let fields = keys.map(key => this.dbSet.fieldMap.get(key as string)).filter(a => a != null);
    fields = fields.filter(field => !this.primaryFields.some(pri => pri.fieldName == field.fieldName));

    return fields;
  }
  /**
   * Function to generate Limit clause
   *
   * @param {number} size
   * @param {?number} [index]
   * @returns {QuerySet<T>}
   */
  limit(size: number, index?: number): QuerySet<T> {
    return this.createQuerySet().limit(size, index);
  }

  /**
   * Get entity object list
   *
   * @returns {Promise<T[]>}
   */
  list(): Promise<T[]> {
    return this.createQuerySet().list();
  }

  /**
   * Get total count of entity objects
   *
   * @returns {Promise<number>}
   */
  count(): Promise<number> {
    return this.createQuerySet().count();
  }

  /**
   * Get entity objects list and total count
   *
   * @returns {Promise<{ count: number; values: T[] }>}
   */
  listAndCount(): Promise<{ count: number; values: T[] }> {
    return this.createQuerySet().listAndCount();
  }

  /**
   * Get stream of Entity objects
   *
   * @returns {Promise<Readable>}
   */
  stream(): Promise<Readable> {
    return this.createQuerySet().stream();
  }

  /**
   * Get Queryable Select object with custom Type
   *
   * @template K
   * @param {K[]} keys
   * @returns {QuerySet<Pick<T, K>>}
   */
  select<K extends keyof T>(keys: K[]): QuerySet<Pick<T, K>> {
    return this.createQuerySet().select(keys);
  }

  /**
   * Get Queryable Select object with custom Type
   *
   * @param {(keyof T)[]} foreignKeys
   * @returns {QuerySet<T>}
   */
  include(foreignKeys: (keyof T)[]): QuerySet<T> {
    return this.createQuerySet().include(foreignKeys);
  }

  join<A extends object>(expr: IQuerySet<A>, param: exprBuilder.types.IForeignFunc<exprBuilder.WhereExprBuilder<T>, exprBuilder.BaseExprBuilder<A>>, joinType?: sql.types.Join): JoinQuerySet<T, A> {
    return this.createQuerySet().join(expr, param, joinType);
  }
}

export default TableSet;
