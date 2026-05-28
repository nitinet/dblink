var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import * as decorators from '../../src/decorators/index.js';
import Employee from './Employee.js';
let Order = class Order {
    id;
    userId;
    employee;
    orderDate;
    totalAmount;
};
__decorate([
    decorators.Column(),
    decorators.Id,
    __metadata("design:type", Number)
], Order.prototype, "id", void 0);
__decorate([
    decorators.Column('user_id'),
    __metadata("design:type", Number)
], Order.prototype, "userId", void 0);
__decorate([
    decorators.Foreign(Employee, (builder, parent) => builder.eq('id', parent.userId)),
    __metadata("design:type", Employee)
], Order.prototype, "employee", void 0);
__decorate([
    decorators.Column('order_date'),
    __metadata("design:type", Date)
], Order.prototype, "orderDate", void 0);
__decorate([
    decorators.Column('total_amount'),
    __metadata("design:type", Number)
], Order.prototype, "totalAmount", void 0);
Order = __decorate([
    decorators.Table('orders')
], Order);
export default Order;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT3JkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJPcmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLEtBQUssVUFBVSxNQUFNLCtCQUErQixDQUFDO0FBQzVELE9BQU8sUUFBUSxNQUFNLGVBQWUsQ0FBQztBQUdyQyxJQUFNLEtBQUssR0FBWCxNQUFNLEtBQUs7SUFHVCxFQUFFLENBQVU7SUFHWixNQUFNLENBQVU7SUFHaEIsUUFBUSxDQUFZO0lBR3BCLFNBQVMsQ0FBUTtJQUdqQixXQUFXLENBQVU7Q0FDdEIsQ0FBQTtBQWJDO0lBRkMsVUFBVSxDQUFDLE1BQU0sRUFBRTtJQUNuQixVQUFVLENBQUMsRUFBRTs7aUNBQ0Y7QUFHWjtJQURDLFVBQVUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDOztxQ0FDYjtBQUdoQjtJQURDLFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUcsTUFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQzs4QkFDbkYsUUFBUTt1Q0FBQztBQUdwQjtJQURDLFVBQVUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDOzhCQUNwQixJQUFJO3dDQUFDO0FBR2pCO0lBREMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUM7OzBDQUNiO0FBZmpCLEtBQUs7SUFEVixVQUFVLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztHQUNyQixLQUFLLENBZ0JWO0FBRUQsZUFBZSxLQUFLLENBQUMifQ==