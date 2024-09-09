import * as sql from 'dblink-core/src/sql/index.js';
import * as lodash from 'lodash-es';
import { Transform } from 'node:stream';
import * as exprBuilder from '../exprBuilder/index.js';
import DBSet from './DBSet.js';
import IQuerySet from './IQuerySet.js';
class SelectQuerySet extends IQuerySet {
    dbSet;
    EntityType;
    alias;
    stat = new sql.Statement(sql.types.Command.SELECT);
    selectKeys;
    constructor(context, EntityType, dbSet) {
        super();
        this.context = context;
        this.EntityType = EntityType;
        this.dbSet = dbSet;
        this.alias = dbSet.tableName.charAt(0);
        this.stat.collection.value = dbSet.tableName;
        this.stat.collection.alias = this.alias;
        const temp = new this.EntityType();
        this.selectKeys = Reflect.ownKeys(temp);
    }
    prepareSelectStatement() {
        const temp = new this.EntityType();
        const targetKeys = Reflect.ownKeys(temp);
        const fields = this.dbSet.filterFields(targetKeys);
        this.stat.columns = this.getColumnExprs(fields, this.alias ?? undefined);
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
            }
            else {
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
        return dataStream.pipe(new Transform({
            transform: (chunk, encoding, callback) => {
                callback(null, transformerFunc(chunk));
            }
        }));
    }
    async listPlain(keys) {
        const fields = this.dbSet.filterFields(keys);
        this.stat.columns = this.getColumnExprs(fields, this.alias ?? undefined);
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
        const keys = Reflect.ownKeys(new this.EntityType());
        const cols = Array.from(this.dbSet.fieldMap.entries()).filter(a => keys.includes(a[0]));
        const newDbSet = new DBSet('');
        newDbSet.fieldMap = new Map(cols);
        const res = new SelectQuerySet(this.context, EntityType, newDbSet);
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
}
export default SelectQuerySet;
//# sourceMappingURL=SelectQuerySet.js.map