import * as sql from 'dblink-core/lib/sql/index.js';
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
        let tableName = Reflect.getMetadata(decoratorKeys.TABLE_KEY, this.EntityType);
        if (!tableName)
            throw new Error('Table Name Not Found');
        let dbSet = new DBSet(tableName);
        let keys = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
        keys.forEach(key => this.bindDbSetField(dbSet, key));
        return dbSet;
    }
    bindDbSetField(dbSet, key) {
        let columnName = Reflect.getMetadata(decoratorKeys.COLUMN_KEY, this.EntityType.prototype, key);
        if (columnName) {
            let columnType = Reflect.getMetadata('design:type', this.EntityType.prototype, key);
            let primaryKey = Reflect.getMetadata(decoratorKeys.ID_KEY, this.EntityType.prototype, key) === true;
            let fieldMapping = new model.FieldMapping(key, columnName, columnType, primaryKey);
            dbSet.fieldMap.set(key, fieldMapping);
            if (primaryKey)
                this.primaryFields.push(fieldMapping);
        }
    }
    async insert(entity) {
        let stat = new sql.Statement(sql.types.Command.INSERT);
        stat.collection.value = this.dbSet.tableName;
        let keys = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
        let fields = this.dbSet.filterFields(keys);
        fields.forEach(field => {
            let val = Reflect.get(entity, field.fieldName);
            if (val == null)
                return;
            let col = new sql.Collection();
            col.value = field.colName;
            stat.columns.push(col);
            let expr = new sql.Expression('?');
            expr.args.push(val);
            stat.values.push(expr);
        });
        let result = await this.context.executeStatement(stat);
        let finalObj = null;
        if (this.primaryFields.length == 1) {
            let primaryField = this.primaryFields[0];
            let id = result.id ?? Reflect.get(entity, primaryField.fieldName);
            finalObj = await this.get(id);
        }
        else {
            let idParams = [];
            this.primaryFields.forEach(field => {
                idParams.push(Reflect.get(entity, field.fieldName));
            });
            finalObj = await this.get(...idParams);
        }
        if (!finalObj)
            throw new Error('Insert Object Not Found');
        return finalObj;
    }
    async insertBulk(entities) {
        let stmts = entities.map(entity => {
            let stat = new sql.Statement(sql.types.Command.INSERT);
            stat.collection.value = this.dbSet.tableName;
            let keys = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
            let fields = this.dbSet.filterFields(keys);
            fields.forEach(field => {
                let val = Reflect.get(entity, field.fieldName);
                if (val == null)
                    return;
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
    whereExpr(entity) {
        if (!this.primaryFields?.length) {
            throw new Error('Primary Key fields not found');
        }
        let eb = new model.WhereExprBuilder(this.dbSet.fieldMap);
        let expr = new sql.Expression();
        this.primaryFields.forEach((pri, idx) => {
            let temp = Reflect.get(entity, pri.fieldName);
            expr = expr.add(eb.eq(pri.fieldName, temp));
        });
        return expr;
    }
    async update(entity, ...updatedKeys) {
        let stat = new sql.Statement(sql.types.Command.UPDATE);
        stat.collection.value = this.dbSet.tableName;
        let keys = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
        let fields = this.dbSet.filterFields(keys).filter(field => !this.primaryFields.some(pri => pri.fieldName == field.fieldName));
        if (updatedKeys)
            fields = fields.filter(field => updatedKeys.includes(field.fieldName));
        if (fields.length == 0)
            throw new Error('Update Fields Empty');
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
        }
        else {
            let idParams = [];
            this.primaryFields.forEach(field => {
                idParams.push(Reflect.get(entity, field.fieldName));
            });
            let finalObj = await this.get(...idParams);
            if (!finalObj)
                throw new Error('Update Object Not Found');
            return finalObj;
        }
    }
    async updateBulk(entities, ...updatedKeys) {
        let keys = Reflect.getMetadata(decoratorKeys.TABLE_COLUMN_KEYS, this.EntityType.prototype);
        let fields = this.dbSet.filterFields(keys).filter(field => !this.primaryFields.some(pri => pri.fieldName == field.fieldName));
        if (updatedKeys)
            fields = fields.filter(field => updatedKeys.includes(field.fieldName));
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
    async upsert(entity) {
        let idParams = [];
        this.primaryFields.forEach(field => {
            idParams.push(Reflect.get(entity, field.fieldName));
        });
        let obj = await this.get(...idParams);
        if (obj) {
            return this.update(entity);
        }
        else {
            return this.insert(entity);
        }
    }
    async delete(entity) {
        let stat = new sql.Statement(sql.types.Command.DELETE);
        stat.collection.value = this.dbSet.tableName;
        stat.where = this.whereExpr(entity);
        await this.context.executeStatement(stat);
    }
    async deleteBulk(entities) {
        let stmts = entities.map(entity => {
            let stat = new sql.Statement(sql.types.Command.DELETE);
            stat.collection.value = this.dbSet.tableName;
            stat.where = this.whereExpr(entity);
            return stat;
        });
        await this.context.executeStatement(stmts);
    }
    async get(...idParams) {
        if (idParams == null)
            throw new Error('Id parameter cannot be null');
        if (this.primaryFields.length == 0) {
            throw new Error(`No Primary Field Found in Table: ${this.dbSet.tableName}`);
        }
        else if (this.primaryFields.length != idParams.length) {
            throw new Error('Invalid Arguments Length');
        }
        else {
            return this.where(a => {
                let expr = new sql.Expression();
                this.primaryFields.forEach((pri, idx) => {
                    expr = expr.add(a.eq(pri.fieldName, idParams[idx]));
                });
                return expr;
            }).single();
        }
    }
    async getOrThrow(...idParams) {
        let val = await this.get(idParams);
        if (!val)
            throw new Error('Value Not Found');
        return val;
    }
    where(param, ...args) {
        let q = new QuerySet(this.context, this.EntityType, this.dbSet);
        return q.where(param, args);
    }
    groupBy(func) {
        let q = new QuerySet(this.context, this.EntityType, this.dbSet);
        return q.groupBy(func);
    }
    orderBy(func) {
        let q = new QuerySet(this.context, this.EntityType, this.dbSet);
        return q.orderBy(func);
    }
    limit(size, index) {
        let q = new QuerySet(this.context, this.EntityType, this.dbSet);
        return q.limit(size, index);
    }
    list() {
        let q = new QuerySet(this.context, this.EntityType, this.dbSet);
        return q.list();
    }
    count() {
        let q = new QuerySet(this.context, this.EntityType, this.dbSet);
        return q.count();
    }
    listAndCount() {
        let q = new QuerySet(this.context, this.EntityType, this.dbSet);
        return q.listAndCount();
    }
    stream() {
        let q = new QuerySet(this.context, this.EntityType, this.dbSet);
        return q.stream();
    }
    listPlain(keys) {
        let q = new QuerySet(this.context, this.EntityType, this.dbSet);
        return q.listPlain(keys);
    }
    listPlainAndCount(keys) {
        let q = new QuerySet(this.context, this.EntityType, this.dbSet);
        return q.listPlainAndCount(keys);
    }
    select(EntityType) {
        let res = new SelectQuerySet(this.context, EntityType, this.dbSet);
        return res;
    }
}
export default TableSet;
//# sourceMappingURL=TableSet.js.map