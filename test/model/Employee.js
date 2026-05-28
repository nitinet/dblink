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
import Department from './Department.js';
let Employee = class Employee {
    id;
    firstName;
    lastName;
    email;
    createdAt;
    departmentId;
    department;
};
__decorate([
    decorators.Column(),
    decorators.Id,
    __metadata("design:type", Number)
], Employee.prototype, "id", void 0);
__decorate([
    decorators.Column('first_name'),
    __metadata("design:type", String)
], Employee.prototype, "firstName", void 0);
__decorate([
    decorators.Column('last_name'),
    __metadata("design:type", String)
], Employee.prototype, "lastName", void 0);
__decorate([
    decorators.Column(),
    __metadata("design:type", String)
], Employee.prototype, "email", void 0);
__decorate([
    decorators.Column('created_at'),
    __metadata("design:type", Date)
], Employee.prototype, "createdAt", void 0);
__decorate([
    decorators.Column('department_id'),
    __metadata("design:type", Number)
], Employee.prototype, "departmentId", void 0);
__decorate([
    decorators.Foreign(Department, (builder, parent) => builder.eq('id', parent.departmentId)),
    __metadata("design:type", Department)
], Employee.prototype, "department", void 0);
Employee = __decorate([
    decorators.Table('employees')
], Employee);
export default Employee;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW1wbG95ZWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJFbXBsb3llZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLEtBQUssVUFBVSxNQUFNLCtCQUErQixDQUFDO0FBQzVELE9BQU8sVUFBVSxNQUFNLGlCQUFpQixDQUFDO0FBR3pDLElBQU0sUUFBUSxHQUFkLE1BQU0sUUFBUTtJQUdaLEVBQUUsQ0FBVTtJQUdaLFNBQVMsQ0FBVTtJQUduQixRQUFRLENBQVU7SUFHbEIsS0FBSyxDQUFVO0lBR2YsU0FBUyxDQUFRO0lBR2pCLFlBQVksQ0FBVTtJQUd0QixVQUFVLENBQWM7Q0FDekIsQ0FBQTtBQW5CQztJQUZDLFVBQVUsQ0FBQyxNQUFNLEVBQUU7SUFDbkIsVUFBVSxDQUFDLEVBQUU7O29DQUNGO0FBR1o7SUFEQyxVQUFVLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQzs7MkNBQ2I7QUFHbkI7SUFEQyxVQUFVLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQzs7MENBQ2I7QUFHbEI7SUFEQyxVQUFVLENBQUMsTUFBTSxFQUFFOzt1Q0FDTDtBQUdmO0lBREMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7OEJBQ3BCLElBQUk7MkNBQUM7QUFHakI7SUFEQyxVQUFVLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQzs7OENBQ2I7QUFHdEI7SUFEQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFHLE1BQW1CLENBQUMsWUFBWSxDQUFDLENBQUM7OEJBQzVGLFVBQVU7NENBQUM7QUFyQnBCLFFBQVE7SUFEYixVQUFVLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQztHQUN4QixRQUFRLENBc0JiO0FBRUQsZUFBZSxRQUFRLENBQUMifQ==