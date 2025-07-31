import { JOIN_KEY } from './Constants.js';
function Join(EntityType, joinFunc) {
  return function (target, propertyKey) {
    const joinMeta = {
      EntityType,
      joinFunc
    };
    Reflect.defineMetadata(JOIN_KEY, joinMeta, target, propertyKey);
  };
}
export default Join;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSm9pbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkpvaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0EsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBVzFDLFNBQVMsSUFBSSxDQUFxQyxVQUEwQixFQUFFLFFBQW9EO0lBQ2hJLE9BQU8sVUFBVSxNQUFjLEVBQUUsV0FBNEI7UUFDM0QsTUFBTSxRQUFRLEdBQUc7WUFDZixVQUFVO1lBQ1YsUUFBUTtTQUNULENBQUM7UUFFRixPQUFPLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2xFLENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxlQUFlLElBQUksQ0FBQyJ9
