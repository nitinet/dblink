import * as sql from 'dblink-core/src/sql/index.js';
import * as decoratorKeys from '../decorators/Constants.js';
import * as model from '../exprBuilder/index.js';
import DBSet from './DBSet.js';
import IQuerySet from './IQuerySet.js';
import QuerySet from './QuerySet.js';
import SelectQuerySet from './SelectQuerySet.js';
class TableSet extends IQuerySet {
  EntityType;
  dbSet;
  primaryFields = [];
  constructor(EntityType) {
    super();
    this.EntityType = EntityType;
    this.dbSet = this.createDbSet();
  }
  getEntityType() {
    return this.EntityType;
  }
  createDbSet() {
    const tableName = Reflect.getMetadata(decoratorKeys.TABLE_KEY, this.EntityType);
    if (!tableName) throw new Error('Table Name Not Found');
    const dbSet = new DBSet(tableName);
    const keys = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
    keys.forEach(key => this.bindDbSetField(dbSet, key));
    return dbSet;
  }
  bindDbSetField(dbSet, key) {
    const columnName = Reflect.getMetadata(decoratorKeys.COLUMN_KEY, this.EntityType.prototype, key);
    if (columnName) {
      const dataType = Reflect.getMetadata('design:type', this.EntityType.prototype, key);
      const primaryKey = Reflect.getMetadata(decoratorKeys.ID_KEY, this.EntityType.prototype, key) === true;
      const fieldMapping = new model.FieldMapping(key, columnName, dataType, primaryKey);
      dbSet.fieldMap.set(key, fieldMapping);
      if (primaryKey) this.primaryFields.push(fieldMapping);
    }
  }
  async insert(entity) {
    const stat = new sql.Statement(sql.types.Command.INSERT);
    stat.collection.value = this.dbSet.tableName;
    const keys = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
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
  async insertAndFetch(entity) {
    const stat = new sql.Statement(sql.types.Command.INSERT);
    stat.collection.value = this.dbSet.tableName;
    const keys = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
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
        const id = result.rows[0].id;
        return this.getOrThrow(id);
      } else {
        const row = result.rows[0];
        const idParams = this.primaryFields.map(field => {
          return row[field.colName];
        });
        return this.getOrThrow(...idParams);
      }
    } else {
      const idParams = this.primaryFields.map(field => {
        return Reflect.get(entity, field.fieldName);
      });
      return await this.getOrThrow(...idParams);
    }
  }
  async insertBulk(entities) {
    const stmts = entities.map(entity => {
      const stat = new sql.Statement(sql.types.Command.INSERT);
      stat.collection.value = this.dbSet.tableName;
      const keys = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
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
  whereExpr(entity) {
    if (!this.primaryFields?.length) {
      throw new Error('Primary Key fields not found');
    }
    const eb = new model.WhereExprBuilder(this.dbSet.fieldMap);
    let expr = new sql.Expression();
    this.primaryFields.forEach(pri => {
      const val = Reflect.get(entity, pri.fieldName);
      expr = expr.add(eb.eq(pri.fieldName, this.context.handler.serializeValue(val, pri.dataType)));
    });
    return expr;
  }
  async update(entity, ...updatedKeys) {
    const stat = new sql.Statement(sql.types.Command.UPDATE);
    stat.collection.value = this.dbSet.tableName;
    const keys = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
    let fields = this.dbSet.getFieldMappingsByKeys(keys).filter(field => !this.primaryFields.some(pri => pri.fieldName == field.fieldName));
    if (updatedKeys) fields = fields.filter(field => updatedKeys.includes(field.fieldName));
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
      const idParams = [];
      this.primaryFields.forEach(field => {
        idParams.push(Reflect.get(entity, field.fieldName));
      });
      const finalObj = await this.get(...idParams);
      if (!finalObj) throw new Error('Update Object Not Found');
      return finalObj;
    }
  }
  async updateBulk(entities, ...updatedKeys) {
    const keys = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
    let fields = this.dbSet.getFieldMappingsByKeys(keys).filter(field => !this.primaryFields.some(pri => pri.fieldName == field.fieldName));
    if (updatedKeys) fields = fields.filter(field => updatedKeys.includes(field.fieldName));
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
  async upsert(entity) {
    const idParams = [];
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
  async delete(entity) {
    const stat = new sql.Statement(sql.types.Command.DELETE);
    stat.collection.value = this.dbSet.tableName;
    stat.where = this.whereExpr(entity);
    await this.context.runStatement(stat);
  }
  async deleteBulk(entities) {
    const stmts = entities.map(entity => {
      const stat = new sql.Statement(sql.types.Command.DELETE);
      stat.collection.value = this.dbSet.tableName;
      stat.where = this.whereExpr(entity);
      return stat;
    });
    await this.context.runStatement(stmts);
  }
  async get(...idParams) {
    if (idParams == null) throw new Error('Id parameter cannot be null');
    if (this.primaryFields.length == 0) {
      throw new Error(`No Primary Field Found in Table: ${this.dbSet.tableName}`);
    } else if (this.primaryFields.length != idParams.length) {
      throw new Error('Invalid Arguments Length');
    } else {
      return this.where(a => {
        let expr = new sql.Expression();
        this.primaryFields.forEach((pri, idx) => {
          expr = expr.add(a.eq(pri.fieldName, this.context.handler.serializeValue(idParams[idx], pri.dataType)));
        });
        return expr;
      }).single();
    }
  }
  async getOrThrow(...idParams) {
    const val = await this.get(...idParams);
    if (!val) throw new Error('Value Not Found');
    return val;
  }
  where(param, ...args) {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.where(param, args);
  }
  groupBy(func) {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.groupBy(func);
  }
  orderBy(func) {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.orderBy(func);
  }
  limit(size, index) {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.limit(size, index);
  }
  list() {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.list();
  }
  count() {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.count();
  }
  listAndCount() {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.listAndCount();
  }
  stream() {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.stream();
  }
  listPlain(keys) {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.listPlain(keys);
  }
  listPlainAndCount(keys) {
    const q = new QuerySet(this.context, this.EntityType, this.dbSet);
    return q.listPlainAndCount(keys);
  }
  select(EntityType) {
    const res = new SelectQuerySet(this.context, EntityType, this.dbSet);
    return res;
  }
}
export default TableSet;
//# sourceMappingURL=TableSet.js.map
