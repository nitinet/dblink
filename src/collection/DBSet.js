class DBSet {
  tableName;
  fieldMap = new Map();
  constructor(tableName) {
    this.tableName = tableName;
  }
  filterFields(props) {
    const fields = Array.from(this.fieldMap.values());
    return fields.filter(f => props.includes(f.fieldName));
  }
}
export default DBSet;
//# sourceMappingURL=DBSet.js.map
