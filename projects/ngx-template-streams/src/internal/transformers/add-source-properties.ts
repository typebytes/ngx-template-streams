import { tsquery } from '@phenomnomnominal/tsquery';
import * as ts from 'typescript';
import { getComponentClass } from '../../utils/ast-helpers';
import { INTERNAL_PREFIX } from '../constants';
import { OBSERVABLE_EVENT_QUERY } from './queries';

export function addSourcePropertiesTransformer(context: ts.TransformationContext) {
  return (sourceFile: ts.SourceFile) => {
    return getComponentClass(sourceFile)
      .map(addSourceProperties(sourceFile, context))
      .getOrElse(sourceFile);
  };
}

function addSourceProperties(sourceFile: ts.SourceFile, context: ts.TransformationContext) {
  return (nodes: Array<ts.Node>) => {
    const visitor: ts.Visitor = (node: ts.Node) => {
      if (nodes.includes(node)) {
        const classDeclaration = node as ts.ClassDeclaration;

        const observableEvents = tsquery(classDeclaration, OBSERVABLE_EVENT_QUERY) as ts.ClassElement[];

        if (!observableEvents.length) {
          return node;
        }

        const templateStreamProperties = observableEvents.map((observableEvent: ts.PropertyDeclaration) => {
          const propertyName = observableEvent.name as ts.Identifier;

          return ts.createProperty(
            undefined,
            undefined,
            ts.createIdentifier(INTERNAL_PREFIX + propertyName.text),
            undefined,
            undefined,
            undefined
          );
        });

        return ts.updateClassDeclaration(
          classDeclaration,
          classDeclaration.decorators,
          classDeclaration.modifiers,
          classDeclaration.name,
          classDeclaration.typeParameters,
          classDeclaration.heritageClauses,
          ts.createNodeArray([...classDeclaration.members, ...templateStreamProperties])
        );
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor);
  };
}
