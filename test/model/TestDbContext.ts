import Context from '../../src/Context.js';
import TableSet from '../../src/collection/TableSet.js';
import User from './User.js';
import Order from './Order.js';
import Department from './Department.js';
import Employee from './Employee.js';
import Profile from './Profile.js';

class TestDbContext extends Context {
  users = new TableSet(User);
  orders = new TableSet(Order);
  departments = new TableSet(Department);
  employees = new TableSet(Employee);
  profiles = new TableSet(Profile);
}

export default TestDbContext;
