export const COMPONENT_CLASS_QUERY = 'ClassDeclaration:has(Decorator:has(Identifier[name="Component"]))';
export const DECORATOR_ARGUMENTS_QUERY = 'Decorator CallExpression';
export const OBSERVABLE_EVENT_QUERY = getPropertyDecoratorQuery('ObservableEvent');

/**
 * Composed Queries
 */

export const INLINE_TEMPLATE_QUERY = `${COMPONENT_CLASS_QUERY} PropertyAssignment:has(Identifier[name="template"])`;
export const VIEW_CHILD_OPTIONS = `PropertyAssignment:has(Identifier[name="static"],[name="read"])`;

/**
 *
 * Computed Queries
 */

export function getPropertyDecoratorQuery(name: string) {
  return `PropertyDeclaration:has(Decorator:has(Identifier[name="${name}"]))`;
}

export function getPropertyQuery(name: string) {
  return `PropertyAssignment:has(Identifier[name="${name}"])`;
}

export function getLifecycleQuery(lifecycle: string) {
  return `${COMPONENT_CLASS_QUERY} MethodDeclaration:has(Identifier[name="${lifecycle}"])`;
}

export function getEventStreamDecoratorQuery(name: string) {
  return `${COMPONENT_CLASS_QUERY} ${getPropertyDecoratorQuery(name)}`;
}

export function getNamedImportsQuery(moduleName: string) {
  return `ImportDeclaration[moduleSpecifier.text="${moduleName}"] NamedImports`;
}

export function getImportSpecifierQuery(name: string) {
  return `ImportSpecifier:has(Identifier[text="${name}"])`;
}
