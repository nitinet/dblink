import * as sql from 'dblink-core/src/sql/index.js';
import IQuerySet from './IQuerySet.js';
class JoinQuerySet extends IQuerySet {
    mainSet;
    joinSet;
    stat;
    constructor(mainSet, joinSet, joinType, expr) {
        super();
        this.mainSet = mainSet;
        this.context = mainSet.context;
        this.joinSet = joinSet;
        this.stat = new sql.Statement(sql.types.Command.SELECT);
        this.stat.collection.join = joinType;
        this.stat.where = this.stat.where.add(expr);
    }
    count() {
        throw new Error('Method not implemented.');
    }
    async list() {
        return [];
    }
    listAndCount() {
        throw new Error('Method not implemented.');
    }
    stream() {
        throw new Error('Method not implemented.');
    }
    listPlain() {
        throw new Error('Method not implemented.');
    }
    listPlainAndCount() {
        throw new Error('Method not implemented.');
    }
    async mapData() {
        return [];
    }
    select() {
        throw new Error('Method not implemented.');
    }
    where() {
        return this;
    }
    groupBy() {
        return this;
    }
    orderBy() {
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
export default JoinQuerySet;
//# sourceMappingURL=JoinQuerySet.js.map