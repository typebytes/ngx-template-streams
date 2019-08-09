import { flatten } from 'fp-ts/lib/Array';
import { fromNullable, some } from 'fp-ts/lib/Option';
import * as ts from 'typescript';
import {
  findNodes,
  findProperty,
  findPropertyByDecorator,
  getAllViewChildOptions,
  getComponentClass,
  getDecoratorArguments,
  getNamedImports,
  hasImportSpecifier
} from '../../utils/ast-helpers';
import { ObservableDecorator } from '../../utils/models';
import { INTERNAL_PREFIX } from '../constants';
import { getPropertyDecoratorQuery } from './queries';

enum ViewDecorator {
  ViewChild = 'ViewChild',
  ViewChildren = 'ViewChildren'
}

const ANGULAR_CORE_IMPORT = '@angular/core';

type DecoratorDeps = { [key in ObservableDecorator]: ViewDecorator };

const decoratorDeps: Partial<DecoratorDeps> = {
  ObservableChild: ViewDecorator.ViewChild,
  ObservableChildren: ViewDecorator.ViewChildren
};

export function addViewDecoratorsTransformer(context: ts.TransformationContext) {
  return (sourceFile: ts.SourceFile) => {
    return some(sourceFile)
      .chain(addImports(context))
      .chain(addProperties(context))
      .getOrElse(sourceFile);
  };
}

function addImports(context: ts.TransformationContext) {
  return (sourceFile: ts.SourceFile) => {
    const importsToAdd: ViewDecorator[] = getImportDependencies(sourceFile);

    const result = getNamedImports(sourceFile, ANGULAR_CORE_IMPORT).map(
      updateImports(importsToAdd, sourceFile, context)
    );

    return result.isNone() ? some(sourceFile) : result;
  };
}

function addProperties(context: ts.TransformationContext) {
  return (sourceFile: ts.SourceFile) => {
    return getComponentClass(sourceFile).map(updateClassDeclaration(sourceFile, context));
  };
}

function updateClassDeclaration(sourceFile: ts.SourceFile, context: ts.TransformationContext) {
  return (nodes: Array<ts.Node>) => {
    const visitor: ts.Visitor = (node: ts.Node) => {
      if (nodes.includes(node)) {
        const classDeclaration = node as ts.ClassDeclaration;

        const nodesByDecorator = Object.keys(decoratorDeps).map((decorator: ObservableDecorator) => {
          return findPropertyByDecorator(classDeclaration, decorator).map(property => {
            const [selector, , options] = getDecoratorArguments(property);

            const dep = decoratorDeps[decorator];
            const args = [selector];

            if (dep === ViewDecorator.ViewChild) {
              args.push(ts.createObjectLiteral(getQueryOptions(options)));
            }

            const propertyDecorator = ts.createDecorator(ts.createCall(ts.createIdentifier(dep), undefined, args));

            return ts.createProperty(
              [propertyDecorator],
              undefined,
              ts.createIdentifier(INTERNAL_PREFIX + property.name.getText()),
              undefined,
              undefined,
              undefined
            );
          });
        });

        const propertiesToAdd = flatten(nodesByDecorator);

        if (!propertiesToAdd.length) {
          return classDeclaration;
        }

        return ts.updateClassDeclaration(
          classDeclaration,
          classDeclaration.decorators,
          classDeclaration.modifiers,
          classDeclaration.name,
          classDeclaration.typeParameters,
          classDeclaration.heritageClauses,
          ts.createNodeArray([...classDeclaration.members, ...propertiesToAdd])
        );
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor);
  };
}

function updateImports(importsToAdd: ViewDecorator[], sourceFile: ts.SourceFile, context: ts.TransformationContext) {
  return (nodes: Array<ts.Node>) => {
    const visitor: ts.Visitor = (node: ts.Node) => {
      if (nodes.includes(node)) {
        const namedImports = node as ts.NamedImports;

        importsToAdd = importsToAdd.filter(i => !hasImportSpecifier(sourceFile, i));

        if (!importsToAdd.length) {
          return namedImports;
        }

        const newImportSpecifier = createImportSpecifier(importsToAdd);

        return ts.updateNamedImports(
          namedImports,
          ts.createNodeArray([...newImportSpecifier, ...namedImports.elements])
        );
      }

      return ts.visitEachChild(node, visitor, context);
    };

    if (!nodes.length) {
      const newImports = createImportSpecifier(importsToAdd);
      const namedImports = ts.createNamedImports(ts.createNodeArray([...newImports]));
      const importClause = ts.createImportClause(undefined, namedImports);

      const importDeclaration = ts.createImportDeclaration(
        undefined,
        undefined,
        importClause,
        ts.createLiteral(ANGULAR_CORE_IMPORT)
      );

      return ts.updateSourceFileNode(sourceFile, ts.createNodeArray([importDeclaration, ...sourceFile.statements]));
    }

    return ts.visitNode(sourceFile, visitor);
  };
}

function getImportDependencies(sourceFile: ts.SourceFile): ViewDecorator[] {
  const findDecorator = (decorator: ViewDecorator) => {
    return findNodes<ts.PropertyDeclaration>(sourceFile, getPropertyDecoratorQuery(decorator))
      .map(_ => decoratorDeps[decorator])
      .getOrElse(undefined);
  };

  return Object.keys(decoratorDeps)
    .map(findDecorator)
    .filter(Boolean);
}

function createImportSpecifier(identifiers: string[]) {
  return identifiers.map(name => ts.createImportSpecifier(undefined, ts.createIdentifier(name)));
}

function getQueryOptions(options: ts.Expression) {
  return fromNullable(options)
    .chain(options => {
      const allOptions = getAllViewChildOptions(options);
      const missingProperty = findProperty(options, 'static').filter(nodes => !nodes.length);

      return missingProperty.isSome()
        ? allOptions.map(userOptions => {
            const defaultOptions = getDefaultQueryOptions();
            return [...defaultOptions, ...userOptions];
          })
        : allOptions;
    })
    .getOrElse(getDefaultQueryOptions());
}

function getDefaultQueryOptions() {
  return [ts.createPropertyAssignment('static', ts.createFalse())];
}
