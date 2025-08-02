import * as decorators from '../../src/decorators/index.js';

@decorators.Table('profiles')
class Profile {
  @decorators.Column()
  @decorators.Id
  id: number = 0;
  @decorators.Column()
  name: string = '';
  @decorators.Column()
  email: string = '';
  @decorators.Column()
  createdAt: Date = new Date();
  @decorators.Column()
  updatedAt: Date = new Date();
}

export default Profile;
