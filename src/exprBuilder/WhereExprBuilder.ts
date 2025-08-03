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
   * Function to create an Expression from an operand
   * Converts literal values to parameterized expressions
   *
   * @private
   * @param {OperandType<T, keyof T>} operand - The operand value or expression
   * @returns {Expression} - The resulting SQL expression
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
   * Creates an equality (=) comparison expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to compare
   * @param {OperandType<T, K>} operand - The value to compare against
   * @returns {Expression} - The resulting SQL comparison expression
   */
  eq<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.Equal, this._expr(propName), this._argExp(operand));
  }

  /**
   * Creates a not-equal (!=) comparison expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to compare
   * @param {OperandType<T, K>} operand - The value to compare against
   * @returns {Expression} - The resulting SQL comparison expression
   */
  neq<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.NotEqual, this._expr(propName), this._argExp(operand));
  }

  /**
   * Creates a less-than (<) comparison expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to compare
   * @param {OperandType<T, K>} operand - The value to compare against
   * @returns {Expression} - The resulting SQL comparison expression
   */
  lt<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.LessThan, this._expr(propName), this._argExp(operand));
  }

  /**
   * Creates a greater-than (>) comparison expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to compare
   * @param {OperandType<T, K>} operand - The value to compare against
   * @returns {Expression} - The resulting SQL comparison expression
   */
  gt<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.GreaterThan, this._expr(propName), this._argExp(operand));
  }

  /**
   * Creates a less-than-or-equal (<=) comparison expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to compare
   * @param {OperandType<T, K>} operand - The value to compare against
   * @returns {Expression} - The resulting SQL comparison expression
   */
  lteq<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.LessThanEqual, this._expr(propName), this._argExp(operand));
  }
  /**
   * Creates a greater-than-or-equal (>=) comparison expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to compare
   * @param {OperandType<T, K>} operand - The value to compare against
   * @returns {Expression} - The resulting SQL comparison expression
   */
  gteq<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.GreaterThanEqual, this._expr(propName), this._argExp(operand));
  }

  // Inclusion Functions
  /**
   * Creates an IN inclusion expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to compare
   * @param {...OperandType<T, K>[]} operand - The values to include
   * @returns {Expression} - The resulting SQL inclusion expression
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
   * Creates a BETWEEN inclusion expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to compare
   * @param {OperandType<T, K>} first - The first value in the range
   * @param {OperandType<T, K>} second - The second value in the range
   * @returns {Expression} - The resulting SQL inclusion expression
   */
  between<K extends KeyOf<T>>(propName: K, first: OperandType<T, K>, second: OperandType<T, K>): Expression {
    return new Expression(null, Operator.Between, this._expr(propName), this._argExp(first), this._argExp(second));
  }

  /**
   * Creates a LIKE pattern matching expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to compare
   * @param {OperandType<T, K>} operand - The pattern to match
   * @returns {Expression} - The resulting SQL pattern matching expression
   */
  like<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.Like, this._expr(propName), this._argExp(operand));
  }

  // Null Checks
  /**
   * Creates an IS NULL expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to check for null
   * @returns {Expression} - The resulting SQL null check expression
   */
  isNull<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.IsNull, this._expr(propName));
  }

  /**
   * Creates an IS NOT NULL expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to check for not null
   * @returns {Expression} - The resulting SQL null check expression
   */
  isNotNull<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.IsNotNull, this._expr(propName));
  }

  // Arithmetic Operators
  /**
   * Creates an addition (+) arithmetic expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to add
   * @param {OperandType<T, K>} operand - The value to add
   * @returns {Expression} - The resulting SQL arithmetic expression
   */
  plus<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.Plus, this._expr(propName), this._argExp(operand));
  }

  /**
   * Creates a subtraction (-) arithmetic expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to subtract
   * @param {OperandType<T, K>} operand - The value to subtract
   * @returns {Expression} - The resulting SQL arithmetic expression
   */
  minus<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.Minus, this._expr(propName), this._argExp(operand));
  }

  /**
   * Creates a multiplication (*) arithmetic expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to multiply
   * @param {OperandType<T, K>} operand - The value to multiply
   * @returns {Expression} - The resulting SQL arithmetic expression
   */
  multiply<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.Multiply, this._expr(propName), this._argExp(operand));
  }

  /**
   * Creates a division (/) arithmetic expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to divide
   * @param {OperandType<T, K>} operand - The value to divide by
   * @returns {Expression} - The resulting SQL arithmetic expression
   */
  devide<K extends KeyOf<T>>(propName: K, operand: OperandType<T, K>): Expression {
    return new Expression(null, Operator.Devide, this._expr(propName), this._argExp(operand));
  }

  // Group Functions
  /**
   * Creates a SUM aggregation expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to sum
   * @returns {Expression} - The resulting SQL aggregation expression
   */
  sum<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.Sum, this._expr(propName));
  }

  /**
   * Creates a MIN aggregation expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to find the minimum value of
   * @returns {Expression} - The resulting SQL aggregation expression
   */
  min<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.Min, this._expr(propName));
  }

  /**
   * Creates a MAX aggregation expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to find the maximum value of
   * @returns {Expression} - The resulting SQL aggregation expression
   */
  max<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.Max, this._expr(propName));
  }

  /**
   * Creates a COUNT aggregation expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to count
   * @returns {Expression} - The resulting SQL aggregation expression
   */
  count<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.Count, this._expr(propName));
  }

  /**
   * Creates an AVG (average) aggregation expression
   *
   * @template {KeyOf<T>} K - The property key type
   * @param {K} propName - The property name to average
   * @returns {Expression} - The resulting SQL aggregation expression
   */
  average<K extends KeyOf<T>>(propName: K): Expression {
    return new Expression(null, Operator.Avg, this._expr(propName));
  }
}

export default WhereExprBuilder;
