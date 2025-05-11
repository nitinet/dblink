import Expression from 'dblink-core/src/sql/Expression.js';
import Operator from 'dblink-core/src/sql/types/Operator.js';
import BaseExprBuilder from './BaseExprBuilder.js';
class OrderExprBuilder extends BaseExprBuilder {
    asc(propName) {
        return new Expression(null, Operator.Asc, this._expr(propName));
    }
    desc(propName) {
        return new Expression(null, Operator.Desc, this._expr(propName));
    }
}
export default OrderExprBuilder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT3JkZXJFeHByQnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHByQnVpbGRlci9PcmRlckV4cHJCdWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sVUFBVSxNQUFNLG1DQUFtQyxDQUFDO0FBQzNELE9BQU8sUUFBUSxNQUFNLHVDQUF1QyxDQUFDO0FBRTdELE9BQU8sZUFBZSxNQUFNLHNCQUFzQixDQUFDO0FBWW5ELE1BQU0sZ0JBQW1DLFNBQVEsZUFBa0I7SUFRakUsR0FBRyxDQUFDLFFBQWtCO1FBQ3BCLE9BQU8sSUFBSSxVQUFVLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFRRCxJQUFJLENBQUMsUUFBa0I7UUFDckIsT0FBTyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDbkUsQ0FBQztDQUNGO0FBRUQsZUFBZSxnQkFBZ0IsQ0FBQyJ9