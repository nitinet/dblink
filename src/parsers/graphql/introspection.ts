import { IEntityType } from 'dblink-core/src/types.js';
import { COLUMN_KEY, ID_KEY, TABLE_COLUMN_KEYS, TABLE_KEY } from '../../decorators/Constants.js';
import { GraphQLFieldDef, GraphQLIntrospectionError, GraphQLSchemaIntrospection, GraphQLTypeDef, GraphQLTypeIntrospection, GraphQLTypeRef } from './types.js';

/**
 * Built-in GraphQL scalar types included in every schema introspection response.
 */
const BUILT_IN_SCALARS: GraphQLTypeDef[] = ['String', 'Int', 'Float', 'Boolean', 'ID'].map(name => ({
  kind: 'SCALAR',
  name,
  description: null,
  fields: null,
  inputFields: null,
  enumValues: null,
  interfaces: [],
  possibleTypes: null
}));

/**
 * Map JavaScript / TypeScript constructor types to GraphQL scalar type names.
 */
function jsTypeToGraphQLScalar(designType: unknown): string {
  if (designType === String) return 'String';
  if (designType === Number) return 'Float';
  if (designType === Boolean) return 'Boolean';
  if (designType === Date) return 'String'; // ISO-8601 string
  return 'String';
}

/**
 * Build a non-null scalar TypeRef.
 */
function scalarRef(name: string): GraphQLTypeRef {
  return { kind: 'SCALAR', name, ofType: null };
}

/**
 * GraphQL Introspection Provider
 *
 * Reads decorator metadata from an entity class and produces a GraphQL schema
 * introspection response compatible with the standard `__schema` / `__type`
 * introspection queries.
 *
 * The generated schema exposes:
 * - A `Query` type with one field per registered entity
 * - An OBJECT type for the entity with one field per `@Column`-decorated property
 * - All five built-in GraphQL scalars
 *
 * @example
 * ```typescript
 * // Register one or more entity types
 * const provider = new IntrospectionProvider();
 * provider.register(Employee);
 * provider.register(Department);
 *
 * // Handle __schema introspection queries
 * app.get('/graphql/schema', (_req, res) => {
 *   res.json(provider.getSchemaIntrospection());
 * });
 *
 * // Handle __type introspection queries
 * app.get('/graphql/type/:name', (req, res) => {
 *   res.json(provider.getTypeIntrospection(req.params.name));
 * });
 *
 * // Or handle both via a single execute call
 * app.post('/graphql', (req, res) => {
 *   const result = provider.execute(req.body.query);
 *   res.json(result);
 * });
 * ```
 */
export class IntrospectionProvider {
  private readonly entityTypes: IEntityType<object>[] = [];

  /**
   * Register an entity class whose `@Table` / `@Column` decorators should be
   * reflected into the introspection schema.
   */
  register<T extends object>(EntityType: IEntityType<T>): this {
    this.entityTypes.push(EntityType as IEntityType<object>);
    return this;
  }

  // ---------------------------------------------------------------------------
  // Schema construction
  // ---------------------------------------------------------------------------

  /**
   * Build an OBJECT `GraphQLTypeDef` for the given entity class by reading its
   * decorator metadata.
   */
  buildEntityType<T extends object>(EntityType: IEntityType<T>): GraphQLTypeDef {
    const typeName = EntityType.name;

    const fieldNames: string[] = Reflect.getMetadata(TABLE_COLUMN_KEYS, EntityType.prototype) ?? [];
    if (fieldNames.length === 0) {
      throw new GraphQLIntrospectionError(`Entity "${typeName}" has no @Column-decorated fields. Did you forget to add decorators?`);
    }

    const fields: GraphQLFieldDef[] = fieldNames.map(fieldName => {
      const colName: string = Reflect.getMetadata(COLUMN_KEY, EntityType.prototype, fieldName) ?? fieldName;
      const designType: unknown = Reflect.getMetadata('design:type', EntityType.prototype, fieldName);
      const isPrimary: boolean = !!Reflect.getMetadata(ID_KEY, EntityType.prototype, fieldName);
      const scalar = isPrimary ? 'ID' : jsTypeToGraphQLScalar(designType);

      return {
        name: fieldName,
        description: colName !== fieldName ? `DB column: ${colName}` : null,
        type: scalarRef(scalar),
        args: [],
        isDeprecated: false,
        deprecationReason: null
      };
    });

    return {
      kind: 'OBJECT',
      name: typeName,
      description: `Table: ${Reflect.getMetadata(TABLE_KEY, EntityType) ?? typeName}`,
      fields,
      inputFields: null,
      enumValues: null,
      interfaces: [],
      possibleTypes: null
    };
  }

  /**
   * Build the root `Query` type listing one field per registered entity.
   */
  private buildQueryType(): GraphQLTypeDef {
    const fields: GraphQLFieldDef[] = this.entityTypes.map(EntityType => ({
      name: EntityType.name.charAt(0).toLowerCase() + EntityType.name.slice(1) + 's', // e.g. Employee → employees
      description: null,
      type: { kind: 'LIST', name: null, ofType: scalarRef(EntityType.name) } as GraphQLTypeRef,
      args: [],
      isDeprecated: false,
      deprecationReason: null
    }));

    return {
      kind: 'OBJECT',
      name: 'Query',
      description: 'Root query type',
      fields,
      inputFields: null,
      enumValues: null,
      interfaces: [],
      possibleTypes: null
    };
  }

  // ---------------------------------------------------------------------------
  // Public introspection API
  // ---------------------------------------------------------------------------

  /**
   * Return the full `__schema` introspection response.
   * Includes built-in scalars, entity object types, and the root Query type.
   */
  getSchemaIntrospection(): GraphQLSchemaIntrospection {
    const entityTypeDefs = this.entityTypes.map(e => this.buildEntityType(e));
    const queryType = this.buildQueryType();

    return {
      data: {
        __schema: {
          queryType: { name: 'Query' },
          mutationType: null,
          subscriptionType: null,
          types: [...BUILT_IN_SCALARS, queryType, ...entityTypeDefs],
          directives: []
        }
      }
    };
  }

  /**
   * Return a `__type` introspection response for the named type.
   * Returns `null` inside `data.__type` when the type is not found.
   */
  getTypeIntrospection(typeName: string): GraphQLTypeIntrospection {
    // Search built-in scalars
    const builtIn = BUILT_IN_SCALARS.find(s => s.name === typeName);
    if (builtIn) return { data: { __type: builtIn } };

    if (typeName === 'Query') return { data: { __type: this.buildQueryType() } };

    const EntityType = this.entityTypes.find(e => e.name === typeName);
    if (EntityType) return { data: { __type: this.buildEntityType(EntityType) } };

    return { data: { __type: null } };
  }

  /**
   * Execute a GraphQL introspection query string and return the appropriate
   * introspection response.
   *
   * Handles:
   * - `{ __schema { ... } }` — returns the full schema
   * - `{ __type(name: "TypeName") { ... } }` — returns a single type
   *
   * @example
   * ```typescript
   * const provider = new IntrospectionProvider().register(Employee);
   * const schema = provider.execute('{ __schema { queryType { name } types { name kind } } }');
   * ```
   */
  execute(query: string): GraphQLSchemaIntrospection | GraphQLTypeIntrospection | { errors: { message: string }[] } {
    const trimmed = query.trim();

    if (trimmed.includes('__schema')) {
      return this.getSchemaIntrospection();
    }

    const typeMatch = trimmed.match(/__type\s*\(\s*name\s*:\s*["']([^"']+)["']\s*\)/);
    if (typeMatch) {
      return this.getTypeIntrospection(typeMatch[1]);
    }

    return { errors: [{ message: 'Unsupported introspection query. Use __schema or __type(name: "TypeName").' }] };
  }
}

export default IntrospectionProvider;
