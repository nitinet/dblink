import Expression from 'dblink-core/src/sql/Expression.js';

import FieldMapping from './FieldMapping.js';
import { KeyOf } from './types.js';

/**
 * Base Expression Builder
 *
 * @class BaseExprBuilder
 * @typedef {BaseExprBuilder}
 * @template T
 */
class BaseExprBuilder<T> {
  /**
   * field name to Field Map
   *
   * @private
   * @type {Map<string | number | symbol, FieldMapping>}
   */
  private readonly fieldMap: Map<string | number | symbol, FieldMapping>;

  /**
   * Alias
   *
   * @private
   * @type {(string | undefined)}
   */
  private readonly alias: string | undefined;

  /**
   * Creates an instance of BaseExprBuilder.
   *
   * @constructor
   * @param {Map<string | symbol, FieldMapping>} fieldMap
   * @param {?string} [alias]
   */
  constructor(fieldMap: Map<string | symbol, FieldMapping>, alias?: string) {
    this.fieldMap = fieldMap;
    this.alias = alias;
  }

  /**
   * Create Expression
   *
   * @protected
   * @param {KeyOf<T>} propName
   * @returns {*}
   */
  protected _expr(propName: KeyOf<T>) {
    const field = this.fieldMap.get(propName);
    if (!field) throw new TypeError('Field Not Found');
    const name = this.alias ? this.alias + '.' + field.colName : field.colName;
    return new Expression(name);
  }
}

export default BaseExprBuilder;
