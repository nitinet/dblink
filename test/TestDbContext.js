import Context from '../src/Context.js';
import TableSet from '../src/collection/TableSet.js';
import Department from './model/Department.js';
import Employee from './model/Employee.js';
import Order from './model/Order.js';
class TestDbContext extends Context {
    employees = new TableSet(Employee);
    orders = new TableSet(Order);
    departments = new TableSet(Department);
}
export default TestDbContext;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVzdERiQ29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlRlc3REYkNvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxPQUFPLE1BQU0sbUJBQW1CLENBQUM7QUFDeEMsT0FBTyxRQUFRLE1BQU0sK0JBQStCLENBQUM7QUFDckQsT0FBTyxVQUFVLE1BQU0sdUJBQXVCLENBQUM7QUFDL0MsT0FBTyxRQUFRLE1BQU0scUJBQXFCLENBQUM7QUFDM0MsT0FBTyxLQUFLLE1BQU0sa0JBQWtCLENBQUM7QUFFckMsTUFBTSxhQUFjLFNBQVEsT0FBTztJQUNqQyxTQUFTLEdBQUcsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsTUFBTSxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdCLFdBQVcsR0FBRyxJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztDQUN4QztBQUVELGVBQWUsYUFBYSxDQUFDIn0=