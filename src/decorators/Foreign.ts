import { Expose } from 'class-transformer';
import { IEntityType } from 'dblink-core/src/types.js';
import { IForeignFunc } from '../exprBuilder/types.js';
import WhereExprBuilder from '../exprBuilder/WhereExprBuilder.js';
import { FOREIGN_KEY_FUNC, FOREIGN_KEY_TYPE } from './Constants.js';

/**
 * Foreign Decorator
 * Marks a property as a foreign key relationship to another entity
 * Creates a LinkObject instance for the property to handle the relationship
 *
 * @export
 * @template T - The type of the related entity
 * @template U - The type of the parent entity
 * @param {IEntityType<T>} entityType - The entity type constructor for the related entity
 * @param {IForeignFunc<WhereExprBuilder<T>, U>} foreignFunc - Function defining the relationship between entities
 * @returns {PropertyDecorator} The property decorator function
 */
function Foreign<T extends object, U extends object>(entityType: IEntityType<T>, foreignFunc: IForeignFunc<WhereExprBuilder<T>, U>): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    // Mark as a foreign key
    Reflect.defineMetadata(FOREIGN_KEY_TYPE, entityType, target, propertyKey);
    Reflect.defineMetadata(FOREIGN_KEY_FUNC, foreignFunc, target, propertyKey);

    // Apply Expose decorator from class-transformer for serialization
    Expose()(target, propertyKey);
  };
}

export default Foreign;
