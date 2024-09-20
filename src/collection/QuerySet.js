import * as sql from 'dblink-core/src/sql/index.js';
import * as lodash from 'lodash-es';
import { Transform } from 'node:stream';
import { TABLE_COLUMN_KEYS } from '../decorators/Constants.js';
import * as exprBuilder from '../exprBuilder/index.js';
import IQuerySet from './IQuerySet.js';
import SelectQuerySet from './SelectQuerySet.js';
class QuerySet extends IQuerySet {
  EntityType;
  dbSet;
  alias;
  stat = new sql.Statement(sql.types.Command.SELECT);
  selectKeys;
  constructor(context, EntityType, dbSet) {
    super();
    this.context = context;
    this.EntityType = EntityType;
    this.dbSet = dbSet;
    this.alias = this.dbSet.tableName.charAt(0);
    this.stat.collection.value = this.dbSet.tableName;
    this.stat.collection.alias = this.alias;
    this.selectKeys = Reflect.getMetadata(TABLE_COLUMN_KEYS, this.EntityType.prototype);
  }
  prepareSelectStatement() {
    const targetKeys = Reflect.getMetadata(TABLE_COLUMN_KEYS, this.EntityType.prototype);
    const fields = this.dbSet.getFieldMappingsByKeys(targetKeys);
    this.stat.columns = this.getColumnExprs(fields, this.alias);
  }
  async list() {
    this.prepareSelectStatement();
    const result = await this.context.executeStatement(this.stat);
    return result.rows.map(this.transformer.bind(this));
  }
  async count() {
    const countStmt = lodash.cloneDeep(this.stat);
    countStmt.columns = [new sql.Expression('count(1) as count')];
    countStmt.groupBy.length = 0;
    countStmt.orderBy.length = 0;
    countStmt.limit = new sql.Expression();
    const countResult = await this.context.executeStatement(countStmt);
    return countResult.rows[0]['count'];
  }
  async listAndCount() {
    const values = await this.list();
    const count = await this.count();
    return { count, values };
  }
  transformer(row) {
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
  async stream() {
    this.prepareSelectStatement();
    const dataStream = await this.context.streamStatement(this.stat);
    const transformerFunc = this.transformer.bind(this);
    return dataStream.pipe(
      new Transform({
        transform: (chunk, encoding, callback) => {
          callback(null, transformerFunc(chunk));
        }
      })
    );
  }
  async listPlain(keys) {
    const fields = this.dbSet.getFieldMappingsByKeys(keys);
    this.stat.columns = this.getColumnExprs(fields, this.alias);
    const input = await this.context.executeStatement(this.stat);
    const data = input.rows.map(row => {
      const obj = {};
      fields.forEach(field => {
        const colName = field.colName;
        const val = row[colName] ?? row[colName.toLowerCase()] ?? row[colName.toUpperCase()];
        Reflect.set(obj, field.fieldName, val);
      });
      return obj;
    });
    return data;
  }
  async listPlainAndCount(keys) {
    const values = await this.listPlain(keys);
    const count = await this.count();
    return { count, values };
  }
  select(EntityType) {
    const res = new SelectQuerySet(this.context, EntityType, this.dbSet);
    return res;
  }
  where(param, ...args) {
    const fieldMap = new Map(Array.from(this.dbSet.fieldMap));
    const eb = new exprBuilder.WhereExprBuilder(fieldMap);
    const res = param(eb, args);
    if (res && res instanceof sql.Expression && res.exps.length > 0) {
      this.stat.where = this.stat.where.add(res);
    }
    return this;
  }
  groupBy(param) {
    const fieldMap = new Map(Array.from(this.dbSet.fieldMap));
    const eb = new exprBuilder.GroupExprBuilder(fieldMap);
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
  orderBy(param) {
    const fieldMap = new Map(Array.from(this.dbSet.fieldMap));
    const eb = new exprBuilder.OrderExprBuilder(fieldMap);
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
  limit(size, index) {
    this.stat.limit = new sql.Expression(null, sql.types.Operator.Limit);
    this.stat.limit.exps.push(new sql.Expression(size.toString()));
    if (index) {
      this.stat.limit.exps.push(new sql.Expression(index.toString()));
    }
    return this;
  }
  async update(entity, ...updatedKeys) {
    this.stat.command = sql.types.Command.UPDATE;
    const keys = Reflect.getMetadata(TABLE_COLUMN_KEYS, entity.constructor.prototype);
    const fields = this.dbSet.getFieldMappingsByKeys(keys).filter(field => updatedKeys.includes(field.fieldName));
    if (fields.length == 0) throw new Error('Update Fields Empty');
    fields.forEach(field => {
      const c1 = new sql.Expression(field.colName);
      const c2 = new sql.Expression('?');
      const val = Reflect.get(entity, field.fieldName);
      c2.args.push(val);
      const expr = new sql.Expression(null, sql.types.Operator.Equal, c1, c2);
      this.stat.columns.push(expr);
    });
    const result = await this.context.executeStatement(this.stat);
    if (result.error) throw result.error;
  }
  async delete() {
    this.stat.command = sql.types.Command.DELETE;
    const result = await this.context.executeStatement(this.stat);
    if (result.error) throw result.error;
  }
}
export default QuerySet;
//# sourceMappingURL=QuerySet.js.map
