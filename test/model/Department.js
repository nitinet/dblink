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
let Department = class Department {
    id;
    name;
};
__decorate([
    decorators.Column(),
    decorators.Id,
    __metadata("design:type", Number)
], Department.prototype, "id", void 0);
__decorate([
    decorators.Column(),
    __metadata("design:type", String)
], Department.prototype, "name", void 0);
Department = __decorate([
    decorators.Table('departments')
], Department);
export default Department;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVwYXJ0bWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkRlcGFydG1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsT0FBTyxLQUFLLFVBQVUsTUFBTSwrQkFBK0IsQ0FBQztBQUc1RCxJQUFNLFVBQVUsR0FBaEIsTUFBTSxVQUFVO0lBR2QsRUFBRSxDQUFVO0lBR1osSUFBSSxDQUFVO0NBR2YsQ0FBQTtBQU5DO0lBRkMsVUFBVSxDQUFDLE1BQU0sRUFBRTtJQUNuQixVQUFVLENBQUMsRUFBRTs7c0NBQ0Y7QUFHWjtJQURDLFVBQVUsQ0FBQyxNQUFNLEVBQUU7O3dDQUNOO0FBTlYsVUFBVTtJQURmLFVBQVUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDO0dBQzFCLFVBQVUsQ0FTZjtBQUVELGVBQWUsVUFBVSxDQUFDIn0=