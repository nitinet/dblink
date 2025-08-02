import Expression from 'dblink-core/src/sql/Expression.js';
class BaseExprBuilder {
  fieldColumnMap;
  alias;
  constructor(fieldColumnMap, alias) {
    this.fieldColumnMap = fieldColumnMap;
    this.alias = alias;
  }
  _expr(propName) {
    const column = this.fieldColumnMap.get(propName);
    if (!column) throw new TypeError('Field Not Found');
    const name = this.alias ? this.alias + '.' + column : column;
    return new Expression(name);
  }
}
export default BaseExprBuilder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmFzZUV4cHJCdWlsZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQmFzZUV4cHJCdWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sVUFBVSxNQUFNLG1DQUFtQyxDQUFDO0FBVzNELE1BQU0sZUFBZTtJQU9GLGNBQWMsQ0FBdUI7SUFRckMsS0FBSyxDQUFxQjtJQVMzQyxZQUFZLGNBQW9DLEVBQUUsS0FBYztRQUM5RCxJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztRQUNyQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUNyQixDQUFDO0lBVVMsS0FBSyxDQUFDLFFBQWtCO1FBQ2hDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxNQUFNO1lBQUUsTUFBTSxJQUFJLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBRXBELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQzdELE9BQU8sSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQztDQUNGO0FBRUQsZUFBZSxlQUFlLENBQUMifQ==
