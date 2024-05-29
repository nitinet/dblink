import { ID_KEY } from './Constants.js';

/**
 * Id Decorator
 *
 * @type {{(target: Function): void; (target: Object, propertyKey: string | symbol): void;}}
 */
const Id: {
  (target: Function): void;
  (target: Object, propertyKey: string | symbol): void;
} = Reflect.metadata(ID_KEY, true);

export default Id;
