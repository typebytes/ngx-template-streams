import { tags } from '@angular-devkit/core';
import { Option } from 'fp-ts/lib/Option';
import { escapeQuotes } from '../utils/template-helpers';

export const stripIndent = tags.stripIndent;

export function createTemplate(strings: TemplateStringsArray, ...values: any[]) {
  return escapeQuotes(rawSource(strings, values));
}

export function createInlineTemplate(strings: TemplateStringsArray, ...values: any[]) {
  return rawSource(strings, values);
}

// export function createSourceFile(strings: TemplateStringsArray, ...values: any[]) {
//   return ts.createSourceFile('test-file.ts', rawSource(strings, values), ts.ScriptTarget.ESNext, true);
// }

export function rawSource(strings: TemplateStringsArray, ...values: any[]) {
  return tags.stripIndent(strings, values);
}

export function getParserResultGroups(result: Option<RegExpMatchArray[]>) {
  const results = result.getOrElse([]) as RegExpExecArray[];
  return results.map(result => result.groups);
}

export function getFixtureFactory(type: string) {
  return (name: string) => {
    const fileName = `${name}.${type}`;
    const sourceFile = `${fileName}.ts`;
    const outputFile = `${fileName}.js`;

    return { sourceFile, outputFile };
  };
}
