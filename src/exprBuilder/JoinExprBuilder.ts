import Expression from 'dblink-core/src/sql/Expression.js';
import BaseExprBuilder from './BaseExprBuilder.js';
import { KeyOf } from './types.js';

/**
 * Join Expression Builder
 *
 * @class JoinExprBuilder
 * @typedef {JoinExprBuilder}
 * @template T
 * @extends {BaseExprBuilder<T>}
 */
class JoinExprBuilder<T extends object> extends BaseExprBuilder<T> {
  /**
   * Create a join collection
   *
   * @private
   * @param {string} joinType - The type of join (INNER JOIN, LEFT JOIN, etc.)
   * @param {KeyOf<T>} propName - The property to join on
   * @returns {Expression}
   */
  private createJoin(joinType: string, propName: KeyOf<T>): Expression {
    const targetTable = this._expr(propName);
    const joinExpr = new Expression(joinType + ' ' + targetTable.value);
    return joinExpr;
  }

  /**
   * Inner Join Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @returns {Expression}
   */
  innerJoin<K extends KeyOf<T>>(propName: K): Expression {
    return this.createJoin('INNER JOIN', propName);
  }

  /**
   * Left Join Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @returns {Expression}
   */
  leftJoin<K extends KeyOf<T>>(propName: K): Expression {
    return this.createJoin('LEFT JOIN', propName);
  }

  /**
   * Right Join Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @returns {Expression}
   */
  rightJoin<K extends KeyOf<T>>(propName: K): Expression {
    return this.createJoin('RIGHT JOIN', propName);
  }

  /**
   * Full Outer Join Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @returns {Expression}
   */
  fullOuterJoin<K extends KeyOf<T>>(propName: K): Expression {
    return this.createJoin('FULL OUTER JOIN', propName);
  }

  /**
   * On Expression for Join Conditions
   *
   * @param {Expression} joinExpr - The join expression to add the ON clause to
   * @param {Expression} leftExpr - Left side of the join condition
   * @param {Expression} rightExpr - Right side of the join condition
   * @returns {Expression}
   */
  on(joinExpr: Expression, leftExpr: Expression, rightExpr: Expression): Expression {
    // Construct the ON clause by concatenating the expressions
    const onClause = new Expression('ON ' + leftExpr.value + ' = ' + rightExpr.value);
    return new Expression(joinExpr.value + ' ' + onClause.value);
  }
}

export default JoinExprBuilder;
