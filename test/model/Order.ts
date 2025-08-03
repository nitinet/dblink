import * as decorators from '../../src/decorators/index.js';
import Employee from './Employee.js';

@decorators.Table('orders')
class Order {
  @decorators.Column()
  @decorators.Id
  id!: number;

  @decorators.Column('user_id')
  userId!: number;

  @decorators.Foreign(Employee, (builder, parent) => builder.eq('id', (parent as Order).userId))
  employee!: Employee;

  @decorators.Column('order_date')
  orderDate!: Date;

  @decorators.Column('total_amount')
  totalAmount!: number;
}

export default Order;
