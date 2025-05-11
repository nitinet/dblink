// filepath: /Users/nitin/github/dblink/dblink/src/decorators/Constants.ts
/**
 * Decorator Constants
 *
 * This file defines metadata keys used by decorators to store and retrieve
 * information about database entities, tables, columns, and primary keys.
 *
 * @module decoratorConstants
 */

/** Metadata key for table name */
const TABLE_KEY = 'tableName';

/** Metadata key for column keys collection */
const TABLE_COLUMN_KEYS = 'tableColumnKeys';

/** Metadata key for column name */
const COLUMN_KEY = 'columnName';

/** Metadata key for primary key flag */
const ID_KEY = 'primaryKey';

/** Metadata key for foreign key flag */
const FOREIGN_KEY_TYPE = 'foreignKeyType';
const FOREIGN_KEY_FUNC = 'foreignKeyFunc';

export { COLUMN_KEY, FOREIGN_KEY_TYPE, FOREIGN_KEY_FUNC, ID_KEY, TABLE_COLUMN_KEYS, TABLE_KEY };
