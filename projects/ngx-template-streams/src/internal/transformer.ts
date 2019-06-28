import { tsquery } from '@phenomnomnominal/tsquery';
import { none, some } from 'fp-ts/lib/Option';
import * as ts from 'typescript';
import { updateEventBindings } from './event-binding-engine';

const INLINE_TEMPLATE_QUERY = `ClassDeclaration:has(Decorator:has(Identifier[name="Component"])) PropertyAssignment:has(Identifier[name="template"])`;

export function templateStreamTransformer(context: ts.TransformationContext) {
  return (sourceFile: ts.SourceFile) => {
    return transformInlineTemplate(sourceFile, context).getOrElse(sourceFile);
  };
}

function transformInlineTemplate(sourceFile: ts.SourceFile, context: ts.TransformationContext) {
  return findInlineTemplate(sourceFile).map(updateInlineTemplate(sourceFile, context));
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
  const nodes = tsquery(sourceFile, INLINE_TEMPLATE_QUERY) as ts.PropertyAssignment[];
  return nodes.length ? some(nodes) : none;
}
