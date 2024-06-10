import Expression from 'dblink-core/src/sql/Expression.js';
import Operator from 'dblink-core/src/sql/types/Operator.js';
import BaseExprBuilder from './BaseExprBuilder.js';
import { KeyOf, OperandType } from './types.js';

/**
 * Where Expression Builder
 *
 * @class WhereExprBuilder
 * @typedef {WhereExprBuilder}
 * @template T
 * @extends {BaseExprBuilder<T>}
 */
class WhereExprBuilder<T> extends BaseExprBuilder<T> {
  /**
   * Function to create Argument Expression
   *
   * @private
   * @param {OperandType<T, keyof T>} operand
   * @returns {Expression}
   */
  private _argExp(operand: OperandType<T, keyof T>): Expression {
    if (operand instanceof Expression) {
      return operand;
    } else {
      const res = new Expression('?');
      res.args = res.args.concat(operand);
      return res;
    }
  }

  // Comparison Operators
  /**
   * Equal Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {OperandType<T, K>} operand
   * @returns {Expression}
   */
  eq<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.Equal, this._expr(propName), this._argExp(operand));
  }

  /**
   * Not Equal Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {OperandType<T, K>} operand
   * @returns {Expression}
   */
  neq<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.NotEqual, this._expr(propName), this._argExp(operand));
  }

  /**
   * Less than Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {OperandType<T, K>} operand
   * @returns {Expression}
   */
  lt<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.LessThan, this._expr(propName), this._argExp(operand));
  }

  /**
   * Greater than Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {OperandType<T, K>} operand
   * @returns {Expression}
   */
  gt<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.GreaterThan, this._expr(propName), this._argExp(operand));
  }

  /**
   * Less than Equal Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {OperandType<T, K>} operand
   * @returns {Expression}
   */
  lteq<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.LessThanEqual, this._expr(propName), this._argExp(operand));
  }
  /**
   * Greater than Equal Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {OperandType<T, K>} operand
   * @returns {Expression}
   */
  gteq<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.GreaterThanEqual, this._expr(propName), this._argExp(operand));
  }

  // Logical Operators
  /**
   * And Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {Expression} operand
   * @returns {Expression}
   */
  and<K extends KeyOf<T>>(propName: K, operand: Expression): Expression {
    return new Expression(null, Operator.And, this._expr(propName), this._argExp(operand));
  }

  /**
   * Or Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {Expression} operand
   * @returns {Expression}
   */
  or<K extends KeyOf<T>>(propName: K, operand: Expression): Expression {
    return new Expression(null, Operator.Or, this._expr(propName), this._argExp(operand));
  }

  /**
   * Not Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @returns {Expression}
   */
  not<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.Not, this._expr(propName));
  }

  // Inclusion Funtions
  /**
   * In Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {...OperandType<T, K>[]} operand
   * @returns {Expression}
   */
  in<K extends KeyOf<T>>(propName: K, ...operand: OperandType<T, K>[]): Expression {
    const vals = operand.map(val => {
      const arg = new Expression('?');
      arg.args = arg.args.concat(val);
      return arg;
    });
    return new Expression(null, Operator.In, this._expr(propName), ...vals);
  }

  /**
   * Between Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {OperandType<T, K>} first
   * @param {OperandType<T, K>} second
   * @returns {Expression}
   */
  between<K extends KeyOf<T>>(propName: K, first: OperandType<T, K>, second: OperandType<T, K>): Expression {
    return new Expression(null, Operator.Between, this._expr(propName), this._argExp(first), this._argExp(second));
  }

  /**
   * Like Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {OperandType<T, K>} operand
   * @returns {Expression}
   */
  like<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.Like, this._expr(propName), this._argExp(operand));
  }

  // Null Checks
  /**
   * Is Null Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @returns {Expression}
   */
  IsNull<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.IsNull, this._expr(propName));
  }

  /**
   * is Not Null Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @returns {Expression}
   */
  IsNotNull<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.IsNotNull, this._expr(propName));
  }

  // Arithmatic Operators
  /**
   * Plus Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {OperandType<T, K>} operand
   * @returns {Expression}
   */
  plus<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.Plus, this._expr(propName), this._argExp(operand));
  }

  /**
   * Minus Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {OperandType<T, K>} operand
   * @returns {Expression}
   */
  minus<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.Minus, this._expr(propName), this._argExp(operand));
  }

  /**
   * Multiply Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {OperandType<T, K>} operand
   * @returns {Expression}
   */
  multiply<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.Multiply, this._expr(propName), this._argExp(operand));
  }

  /**
   * Devide Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @param {OperandType<T, K>} operand
   * @returns {Expression}
   */
  devide<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.Devide, this._expr(propName), this._argExp(operand));
  }

  // Group Functions
  /**
   * Sum Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @returns {Expression}
   */
  sum<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.Sum, this._expr(propName));
  }

  /**
   * Minimum Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @returns {Expression}
   */
  min<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.Min, this._expr(propName));
  }

  /**
   * Maximum Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @returns {Expression}
   */
  max<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.Max, this._expr(propName));
  }

  /**
   * Count Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @returns {Expression}
   */
  count<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.Count, this._expr(propName));
  }

  /**
   * Average Expression
   *
   * @template {KeyOf<T>} K
   * @param {K} propName
   * @returns {Expression}
   */
  average<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.Avg, this._expr(propName));
  }
}

export default WhereExprBuilder;
