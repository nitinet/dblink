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
