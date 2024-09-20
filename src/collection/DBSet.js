class DBSet {
  tableName;
  fieldMap = new Map();
  constructor(tableName) {
    this.tableName = tableName;
  }
  getFieldMappingsByKeys(props) {
    return props
      .map(a => {
        return this.fieldMap.get(a);
      })
      .filter(a => a != undefined);
  }
}
export default DBSet;
//# sourceMappingURL=DBSet.js.map
