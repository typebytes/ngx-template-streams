import { tags } from '@angular-devkit/core';
import { Option } from 'fp-ts/lib/Option';
import { resolve } from 'path';
import { escapeQuotes } from '../utils/template-helpers';

export const stripIndent = tags.stripIndent;

export const fixtures = resolve(__dirname, '../fixtures');

export function createTemplate(strings: TemplateStringsArray, ...values: any[]) {
  return escapeQuotes(rawSource(strings, values));
}

export function createInlineTemplate(strings: TemplateStringsArray, ...values: any[]) {
  return rawSource(strings, values);
}

export function rawSource(strings: TemplateStringsArray, ...values: any[]) {
  return tags.stripIndent(strings, values);
}

export function getParserResultGroups(matches: Option<RegExpMatchArray[]>) {
  const results = matches.getOrElse([]) as RegExpExecArray[];
  return results.map(result => result.groups);
}

export function getFixtureFactory(type?: string) {
  return (name: string) => {
    const fixtureType = type ? `.${type}` : '';
    const fileName = `${name}${fixtureType}`;
    const sourceFile = `${fileName}.ts`;
    const outputFile = `${fileName}.js`;

    return { sourceFile, outputFile };
  };
}
