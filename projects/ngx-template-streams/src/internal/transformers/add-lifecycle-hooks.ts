import { some } from 'fp-ts/lib/Option';
import * as ts from 'typescript';
import { findNodes, getComponentClass } from '../../utils/ast-helpers';
import { LifecycleHook, ObservableDecorator } from '../../utils/models';
import { getEventStreamDecoratorQuery, getLifecycleQuery } from './queries';

type DecoratorHooks = { [key in LifecycleHook]: Array<ObservableDecorator> };

const decoratorHooks: DecoratorHooks = {
  [LifecycleHook.ngOnDestroy]: ['ObservableEvent', 'ObservableChild', 'ObservableChildren'],
  [LifecycleHook.ngAfterViewInit]: ['ObservableChildren']
};

export function addLifecycleHooksTransformer(context: ts.TransformationContext) {
  return (sourceFile: ts.SourceFile) => {
    return some(sourceFile)
      .chain(addLifecycleHook(LifecycleHook.ngOnDestroy, context))
      .chain(addLifecycleHook(LifecycleHook.ngAfterViewInit, context))
      .getOrElse(sourceFile);
  };
}

function addLifecycleHook(lifecycle: LifecycleHook, context: ts.TransformationContext) {
  return (sourceFile: ts.SourceFile) => {
    const result = hasLifecycleHook(lifecycle, sourceFile)
      .filter(lifecycleExists => !lifecycleExists && requiresLifecycleHook(lifecycle, sourceFile))
      .chain(_ => getComponentClass(sourceFile))
      .map(updateComponentClass(lifecycle, sourceFile, context));

    return result.isNone() ? some(sourceFile) : result;
  };
}

function updateComponentClass(lifecycle: LifecycleHook, sourceFile: ts.SourceFile, context: ts.TransformationContext) {
  return (nodes: Array<ts.Node>) => {
    const visitor: ts.Visitor = (node: ts.Node) => {
      if (nodes.includes(node)) {
        const classDeclaration = node as ts.ClassDeclaration;

        const lifecycleMethod = ts.createMethod(
          [],
          undefined,
          undefined,
          ts.createIdentifier(lifecycle),
          undefined,
          undefined,
          undefined,
          undefined,
          ts.createBlock([])
        );

        return ts.updateClassDeclaration(
          classDeclaration,
          classDeclaration.decorators,
          classDeclaration.modifiers,
          classDeclaration.name,
          classDeclaration.typeParameters,
          classDeclaration.heritageClauses,
          ts.createNodeArray([...classDeclaration.members, lifecycleMethod])
        );
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor);
  };
}

function requiresLifecycleHook(lifecycle: LifecycleHook, sourceFile: ts.SourceFile) {
  const nodes = decoratorHooks[lifecycle].map(decorator =>
    findNodes<ts.ClassDeclaration>(sourceFile, getEventStreamDecoratorQuery(decorator))
  );

  return nodes.some(declarations => declarations.isSome());
}

function hasLifecycleHook(lifecycle: LifecycleHook, sourceFile: ts.SourceFile) {
  const nodes = findNodes<ts.ClassDeclaration>(sourceFile, getLifecycleQuery(lifecycle));
  return some(nodes.isSome());
}
