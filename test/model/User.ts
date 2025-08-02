import * as decorators from '../../src/decorators/index.js';

@decorators.Table('users')
class User {
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
}

export default User;
