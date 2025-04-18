import Expression from 'dblink-core/src/sql/Expression.js';
import BaseExprBuilder from './BaseExprBuilder.js';
class JoinExprBuilder extends BaseExprBuilder {
    createJoin(joinType, propName) {
        const targetTable = this._expr(propName);
        const joinExpr = new Expression(joinType + ' ' + targetTable.value);
        return joinExpr;
    }
    innerJoin(propName) {
        return this.createJoin('INNER JOIN', propName);
    }
    leftJoin(propName) {
        return this.createJoin('LEFT JOIN', propName);
    }
    rightJoin(propName) {
        return this.createJoin('RIGHT JOIN', propName);
    }
    fullOuterJoin(propName) {
        return this.createJoin('FULL OUTER JOIN', propName);
    }
    on(joinExpr, leftExpr, rightExpr) {
        const onClause = new Expression('ON ' + leftExpr.value + ' = ' + rightExpr.value);
        return new Expression(joinExpr.value + ' ' + onClause.value);
    }
}
export default JoinExprBuilder;
//# sourceMappingURL=JoinExprBuilder.js.map