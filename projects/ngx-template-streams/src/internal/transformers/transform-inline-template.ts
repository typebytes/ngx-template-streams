import { some } from 'fp-ts/lib/Option';
import * as ts from 'typescript';
import { findNodes } from '../../utils/ast-helpers';
import { updateEventBindings } from '../event-binding-engine';
import { INLINE_TEMPLATE_QUERY } from './queries';

export function inlineTemplateTransformer(context: ts.TransformationContext) {
  return (sourceFile: ts.SourceFile) => {
    return findInlineTemplate(sourceFile)
      .map(updateInlineTemplate(sourceFile, context))
      .getOrElse(sourceFile);
  };
}

function updateInlineTemplate(sourceFile: ts.SourceFile, context: ts.TransformationContext) {
  return (nodes: Array<ts.Node>) => {
    const visitor: ts.Visitor = (node: ts.Node) => {
      if (nodes.includes(node)) {
        const prop = node as ts.PropertyAssignment;

        const currentTemplate = prop.initializer.getFullText();

        const inlineTemplate = ts.createNoSubstitutionTemplateLiteral(
          extractTemplateFromTemplateLiteral(currentTemplate)
            .map(template => updateEventBindings(template, true))
            .getOrElse(currentTemplate)
        );

        return ts.updatePropertyAssignment(prop, prop.name, inlineTemplate);
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor);
  };
}

function extractTemplateFromTemplateLiteral(templateLiteral: string) {
  const [, template] = /[`\s'"]*(.*[^\s`'"])[`\s'"]*/s.exec(templateLiteral);
  return some(template);
}

function findInlineTemplate(sourceFile: ts.SourceFile) {
  return findNodes<ts.PropertyAssignment>(sourceFile, INLINE_TEMPLATE_QUERY);
}
