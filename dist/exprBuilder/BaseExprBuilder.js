import Expression from 'dblink-core/src/sql/Expression.js';
class BaseExprBuilder {
    fieldMap;
    alias;
    constructor(fieldMap, alias) {
        this.fieldMap = fieldMap;
        this.alias = alias;
    }
    _expr(propName) {
        const field = this.fieldMap.get(propName);
        if (!field)
            throw new TypeError('Field Not Found');
        const name = this.alias ? this.alias + '.' + field.colName : field.colName;
        return new Expression(name);
    }
}
export default BaseExprBuilder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmFzZUV4cHJCdWlsZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4cHJCdWlsZGVyL0Jhc2VFeHByQnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFVBQVUsTUFBTSxtQ0FBbUMsQ0FBQztBQWEzRCxNQUFNLGVBQWU7SUFPRixRQUFRLENBQThDO0lBUXRELEtBQUssQ0FBcUI7SUFTM0MsWUFBWSxRQUE0QyxFQUFFLEtBQWM7UUFDdEUsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDckIsQ0FBQztJQVVTLEtBQUssQ0FBQyxRQUFrQjtRQUNoQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxQyxJQUFJLENBQUMsS0FBSztZQUFFLE1BQU0sSUFBSSxTQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNuRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO1FBQzNFLE9BQU8sSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQztDQUNGO0FBRUQsZUFBZSxlQUFlLENBQUMifQ==