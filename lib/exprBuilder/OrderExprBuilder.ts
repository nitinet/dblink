import Expression from 'dblink-core/lib/sql/Expression.js';
import Operator from 'dblink-core/lib/sql/types/Operator.js';

import BaseExprBuilder from './BaseExprBuilder.js';
import { KeyOf } from './types.js';

/**
 * Order Expression Builder
 *
 * @class OrderExprBuilder
 * @typedef {OrderExprBuilder}
 * @template {Object} T
 * @extends {BaseExprBuilder<T>}
 */
class OrderExprBuilder<T extends Object> extends BaseExprBuilder<T> {
  // Sorting Operators
  /**
   * Sort by ascending wrt property
   *
   * @param {KeyOf<T>} propName
   * @returns {*}
   */
  asc(propName: KeyOf<T>) {
    return new Expression(null, Operator.Asc, this._expr(propName));
  }

  /**
   * Sort by descending wrt property
   *
   * @param {KeyOf<T>} propName
   * @returns {*}
   */
  desc(propName: KeyOf<T>) {
    return new Expression(null, Operator.Desc, this._expr(propName));
  }
}

export default OrderExprBuilder;
