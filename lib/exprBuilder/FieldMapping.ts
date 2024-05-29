import { ColumnType, IEntityType } from './types.js';

/**
 * FieldMapping
 *
 * @class FieldMapping
 * @typedef {FieldMapping}
 */
class FieldMapping {
  /**
   * Field Name
   *
   * @type {string}
   */
  fieldName: string;

  /**
   * Column Name
   *
   * @type {string}
   */
  colName: string;

  /**
   * Column Type
   *
   * @type {IEntityType<ColumnType>}
   */
  columnType: IEntityType<ColumnType>;

  /**
   * Is this column Primary Key
   *
   * @type {boolean}
   */
  primaryKey: boolean = false;

  /**
   * Creates an instance of FieldMapping.
   *
   * @constructor
   * @param {string} fieldName
   * @param {string} colName
   * @param {IEntityType<ColumnType>} columnType
   * @param {boolean} primaryKey
   */
  constructor(fieldName: string, colName: string, columnType: IEntityType<ColumnType>, primaryKey: boolean) {
    this.fieldName = fieldName;
    this.colName = colName;
    this.columnType = columnType;
    this.primaryKey = primaryKey;
  }
}

export default FieldMapping;
