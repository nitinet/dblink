import * as decorators from '../../src/decorators/index.js';
import Department from './Department.js';

@decorators.Table('employees')
class Employee {
  @decorators.Column()
  @decorators.Id
  id!: number;

  @decorators.Column('first_name')
  firstName!: string;

  @decorators.Column('last_name')
  lastName!: string;

  @decorators.Column()
  email!: string;

  @decorators.Column('created_at')
  createdAt!: Date;

  @decorators.Column('department_id')
  departmentId!: number;

  @decorators.Foreign(Department, (builder, parent) => builder.eq('id', (parent as Employee).departmentId))
  department!: Department;
}

export default Employee;
