import Expression from 'dblink-core/src/sql/Expression.js';
import Operator from 'dblink-core/src/sql/types/Operator.js';

import BaseExprBuilder from './BaseExprBuilder.js';
import { KeyOf } from './types.js';

/**
 * Order Expression Builder
 * Provides methods for building ORDER BY expressions in a type-safe manner
 *
 * @class OrderExprBuilder
 * @typedef {OrderExprBuilder}
 * @template {Object} T - The entity type being ordered
 * @extends {BaseExprBuilder<T>}
 */
class OrderExprBuilder<T extends object> extends BaseExprBuilder<T> {
  // Sorting Operators
  /**
   * Sort by ascending order with respect to the specified property
   *
   * @param {KeyOf<T>} propName - The property name to sort by
   * @returns {Expression} - The resulting SQL expression
   */
  asc(propName: KeyOf<T>) {
    return new Expression(null, Operator.Asc, this._expr(propName));
  }

  /**
   * Sort by descending order with respect to the specified property
   *
   * @param {KeyOf<T>} propName - The property name to sort by
   * @returns {Expression} - The resulting SQL expression
   */
  desc(propName: KeyOf<T>) {
    return new Expression(null, Operator.Desc, this._expr(propName));
  }
}

export default OrderExprBuilder;
