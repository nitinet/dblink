import Expression from 'dblink-core/src/sql/Expression.js';
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
   * @type {Map<keyof T, string>}
   */
  private readonly fieldColumnMap: Map<keyof T, string>;

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
   * @param {Map<string | symbol, string>} fieldColumnMap - Map of entity fields to database columns
   * @param {?string} [alias] - Optional table alias for SQL queries
   */
  constructor(fieldColumnMap: Map<keyof T, string>, alias?: string) {
    this.fieldColumnMap = fieldColumnMap;
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
    const column = this.fieldColumnMap.get(propName);
    if (!column) throw new TypeError('Field Not Found');

    const name = this.alias ? this.alias + '.' + column : column;
    return new Expression(name);
  }
}

export default BaseExprBuilder;
