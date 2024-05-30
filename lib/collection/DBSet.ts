import * as model from '../exprBuilder/index.js';

/**
 * DBSet
 *
 * @class DBSet
 * @typedef {DBSet}
 */
class DBSet {
  /**
   * Table name
   *
   * @type {string}
   */
  tableName: string;

  /**
   * field name to FieldMapping map
   *
   * @type {Map<string, model.FieldMapping>}
   */
  fieldMap: Map<string, model.FieldMapping> = new Map();

  /**
   * Creates an instance of DBSet.
   *
   * @constructor
   * @param {string} tableName
   */
  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * filter field mappings based on property names
   *
   * @param {(string | symbol)[]} props
   * @returns {model.FieldMapping[]}
   */
  filterFields(props: (string | symbol)[]): model.FieldMapping[] {
    let fields = Array.from(this.fieldMap.values());
    return fields.filter(f => props.includes(f.fieldName));
  }
}

export default DBSet;
