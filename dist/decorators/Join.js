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
//# sourceMappingURL=Join.js.map