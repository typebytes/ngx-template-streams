export const COMPONENT_CLASS_QUERY = 'ClassDeclaration:has(Decorator:has(Identifier[name="Component"]))';
export const OBSERVABLE_EVENT_QUERY = 'PropertyDeclaration:has(Decorator:has(Identifier[name="ObservableEvent"]))';
export const TEMPLATE_PROPERTY_QUERY = 'PropertyAssignment:has(Identifier[name="template"])';

/**
 * Composed Queries
 */

export const INLINE_TEMPLATE_QUERY = `${COMPONENT_CLASS_QUERY} ${TEMPLATE_PROPERTY_QUERY}`;
