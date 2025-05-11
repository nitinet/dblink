import { DataType, IEntityType } from 'dblink-core/src/types';

/**
 * FieldMapping
 * Maps entity properties to database columns with type information
 *
 * @class FieldMapping
 * @typedef {FieldMapping}
 */
class FieldMapping {
  /**
   * Entity property name
   *
   * @type {string}
   */
  fieldName: string;

  /**
   * Database column name
   *
   * @type {string}
   */
  colName: string;

  /**
   * Data type of the column/property
   *
   * @type {IEntityType<DataType>}
   */
  dataType: IEntityType<DataType>;

  /**
   * Indicates whether this column is part of the primary key
   *
   * @type {boolean}
   */
  primaryKey: boolean;

  /**
   * Creates an instance of FieldMapping.
   *
   * @constructor
   * @param {string} fieldName - The entity property name
   * @param {string} colName - The database column name
   * @param {IEntityType<DataType>} dataType - The data type
   * @param {boolean} primaryKey - Whether this is a primary key field
   */
  constructor(fieldName: string, colName: string, dataType: IEntityType<DataType>, primaryKey: boolean) {
    this.fieldName = fieldName;
    this.colName = colName;
    this.dataType = dataType;
    this.primaryKey = primaryKey ?? false;
  }
}

export default FieldMapping;
