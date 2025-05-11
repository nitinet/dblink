import Expression from 'dblink-core/src/sql/Expression.js';

import FieldMapping from './FieldMapping.js';
import { KeyOf } from './types.js';

/**
 * Base Expression Builder
 * Abstract base class for building SQL expressions in a type-safe manner
 *
 * @class BaseExprBuilder
 * @typedef {BaseExprBuilder}
 * @template T - The entity type
 */
class BaseExprBuilder<T> {
  /**
   * Field mapping for entity properties to database columns
   *
   * @private
   * @type {Map<string | number | symbol, FieldMapping>}
   */
  private readonly fieldMap: Map<string | number | symbol, FieldMapping>;

  /**
   * Table alias for SQL queries
   *
   * @private
   * @type {(string | undefined)}
   */
  private readonly alias: string | undefined;

  /**
   * Creates an instance of BaseExprBuilder.
   *
   * @constructor
   * @param {Map<string | symbol, FieldMapping>} fieldMap - Map of entity fields to database columns
   * @param {?string} [alias] - Optional table alias for SQL queries
   */
  constructor(fieldMap: Map<string | symbol, FieldMapping>, alias?: string) {
    this.fieldMap = fieldMap;
    this.alias = alias;
  }

  /**
   * Create a SQL expression for a property
   * Creates an expression that represents a column in the database
   *
   * @protected
   * @param {KeyOf<T>} propName - The entity property name
   * @returns {Expression} - The SQL expression representing the column
   */
  protected _expr(propName: KeyOf<T>) {
    const field = this.fieldMap.get(propName);
    if (!field) throw new TypeError('Field Not Found');
    const name = this.alias ? this.alias + '.' + field.colName : field.colName;
    return new Expression(name);
  }
}

export default BaseExprBuilder;
