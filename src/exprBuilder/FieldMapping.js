class FieldMapping {
  fieldName;
  colName;
  dataType;
  primaryKey;
  constructor(fieldName, colName, dataType, primaryKey) {
    this.fieldName = fieldName;
    this.colName = colName;
    this.dataType = dataType;
    this.primaryKey = primaryKey ?? false;
  }
}
export default FieldMapping;
//# sourceMappingURL=FieldMapping.js.map
