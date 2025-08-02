import * as model from '../exprBuilder/index.js';

/**
 * DBSet
 * Represents a database table or set with field mappings
 *
 * @class DBSet
 * @typedef {DBSet}
 */
class DBSet {
  /**
   * Table name in the database
   *
   * @type {string}
   */
  tableName: string;

  /**
   * Map of field names to their corresponding FieldMapping objects
   * Stores the mapping between entity properties and database columns
   *
   * @type {Map<string, model.FieldMapping>}
   */
  fieldMap: Map<string, model.FieldMapping> = new Map();

  /**
   * Creates an instance of DBSet.
   *
   * @constructor
   * @param {string} tableName - The name of the database table
   */
  constructor(tableName: string) {
    this.tableName = tableName;
  }
}

export default DBSet;
