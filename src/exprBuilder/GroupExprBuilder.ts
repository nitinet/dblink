import BaseExprBuilder from './BaseExprBuilder.js';
import { KeyOf } from './types.js';

/**
 * Group Expression Builder
 *
 * @class GroupExprBuilder
 * @typedef {GroupExprBuilder}
 * @template {Object} T
 * @extends {BaseExprBuilder<T>}
 */
class GroupExprBuilder<T extends object> extends BaseExprBuilder<T> {
  /**
   * Create Expression
   *
   * @param {KeyOf<T>} propName
   * @returns {*}
   */
  expr(propName: KeyOf<T>) {
    return this._expr(propName);
  }
}

export default GroupExprBuilder;
