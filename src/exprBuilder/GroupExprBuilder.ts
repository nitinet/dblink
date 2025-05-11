import BaseExprBuilder from './BaseExprBuilder.js';
import { KeyOf } from './types.js';

/**
 * Group Expression Builder
 * Provides methods for building GROUP BY expressions in a type-safe manner
 *
 * @class GroupExprBuilder
 * @typedef {GroupExprBuilder}
 * @template {Object} T - The entity type being grouped
 * @extends {BaseExprBuilder<T>}
 */
class GroupExprBuilder<T extends object> extends BaseExprBuilder<T> {
  /**
   * Create an expression for grouping by the specified property
   *
   * @param {KeyOf<T>} propName - The property name to group by
   * @returns {import('dblink-core/src/sql/Expression.js').default} - The resulting SQL expression
   */
  expr(propName: KeyOf<T>) {
    return this._expr(propName);
  }
}

export default GroupExprBuilder;
