import * as exprBuilder from '../exprBuilder/index.js';
import QuerySet from './QuerySet.js';
class LinkSet extends QuerySet {
    foreignFunc;
    constructor(context, entityType, dbSet, foreignFunc) {
        super(context, entityType, dbSet);
        this.foreignFunc = foreignFunc;
    }
    apply(parentObj) {
        let eb = new exprBuilder.WhereExprBuilder(this.dbSet.fieldMap);
        let expr = this.foreignFunc(eb, parentObj);
        if (expr && expr.exps.length > 0) {
            this.stat.where = this.stat.where.add(expr);
        }
    }
}
export default LinkSet;
//# sourceMappingURL=LinkSet.js.map