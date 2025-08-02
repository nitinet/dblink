import * as decorators from '../../src/decorators/index.js';
import User from './User.js';

@decorators.Table('orders')
class Order {
  @decorators.Column()
  @decorators.Id
  id!: number;

  @decorators.Column('user_id')
  userId!: number;

  @decorators.Foreign(User, (builder, parent) => builder.eq('id', (parent as Order).userId))
  user!: User;

  @decorators.Column('order_date')
  orderDate!: Date;

  @decorators.Column('total_amount')
  totalAmount!: number;
}

export default Order;
