import { DataType, IEntityType } from 'dblink-core/src/types';

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
   * @type {IEntityType<DataType>}
   */
  dataType: IEntityType<DataType>;

  /**
   * Is this column Primary Key
   *
   * @type {boolean}
   */
  primaryKey: boolean;

  /**
   * Creates an instance of FieldMapping.
   *
   * @constructor
   * @param {string} fieldName
   * @param {string} colName
   * @param {IEntityType<DataType>} dataType
   * @param {boolean} primaryKey
   */
  constructor(fieldName: string, colName: string, dataType: IEntityType<DataType>, primaryKey: boolean) {
    this.fieldName = fieldName;
    this.colName = colName;
    this.dataType = dataType;
    this.primaryKey = primaryKey ?? false;
  }
}

export default FieldMapping;
