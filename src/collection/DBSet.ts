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

  /**
   * Filter field mappings based on property names
   * Returns an array of FieldMapping objects for the specified property names
   *
   * @param {string[]} props - The property names to filter by
   * @returns {model.FieldMapping[]} - Array of field mappings for the specified properties
   */
  getFieldMappingsByKeys(props: string[]): model.FieldMapping[] {
    return props
      .map(a => {
        return this.fieldMap.get(a);
      })
      .filter(a => a != undefined);
  }
}

export default DBSet;
