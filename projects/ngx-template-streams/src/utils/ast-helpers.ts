import { tsquery } from '@phenomnomnominal/tsquery';
import { none, Option, some } from 'fp-ts/lib/Option';
import * as ts from 'typescript';
import * as Queries from '../internal/transformers/queries';

export function findNodes<T extends ts.Node>(node: ts.Node, query: string): Option<T[]> {
  const nodes = tsquery(node, query) as Array<T>;
  return nodes.length ? some(nodes) : none;
}

export function getComponentClass(node: ts.Node) {
  return findNodes<ts.ClassDeclaration>(node, Queries.COMPONENT_CLASS_QUERY);
}

export function getNamedImports(node: ts.Node, moduleName: string) {
  const nodes = findNodes<ts.NamedImports>(node, Queries.getNamedImportsQuery(moduleName));
  return nodes.isSome() ? nodes : some([]);
}

export function findPropertyByDecorator(node: ts.Node, decorator: string) {
  const nodes = findNodes<ts.PropertyDeclaration>(node, Queries.getPropertyDecoratorQuery(decorator));
  return nodes.getOrElse([]);
}

export function hasImportSpecifier(node: ts.Node, specifierName: string) {
  const nodes = findNodes<ts.ImportSpecifier>(node, Queries.getImportSpecifierQuery(specifierName));
  return nodes.isSome() ? true : false;
}

export function getDecoratorArguments(node: ts.Node) {
  const nodes = findNodes<ts.CallExpression>(node, Queries.DECORATOR_ARGUMENTS_QUERY).getOrElse([]);
  return nodes[0].arguments;
}

export function getAllViewChildOptions(node: ts.Node) {
  return findNodes<ts.PropertyAssignment>(node, Queries.VIEW_CHILD_OPTIONS);
}

export function findProperty(node: ts.Node, name: string) {
  const nodes = findNodes<ts.PropertyAssignment>(node, Queries.getPropertyQuery(name));
  return some(nodes.getOrElse([]));
}
