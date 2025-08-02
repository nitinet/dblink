import * as decorators from '../../src/decorators/index.js';

@decorators.Table('departments')
class Department {
  @decorators.Column()
  @decorators.Id
  id!: number;

  @decorators.Column()
  name!: string;

  // Note: Employee relationship would be defined in Employee model to avoid circular imports
}

export default Department;
