import * as decorators from '../../src/decorators/index.js';
import Department from './Department.js';

@decorators.Table('employees')
class Employee {
  @decorators.Column()
  @decorators.Id
  id!: number;

  @decorators.Column('department_id')
  departmentId!: number;

  @decorators.Column()
  name!: string;

  @decorators.Foreign(Department, (builder, parent) => builder.eq('id', (parent as Employee).departmentId))
  department!: Department;
}

export default Employee;
