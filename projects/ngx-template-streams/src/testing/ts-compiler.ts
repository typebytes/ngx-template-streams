import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as ts from 'typescript';
import { printFileContent } from '../utils/ts-helpers';
import { fixtures } from './test-helpers';

export function transformFile(fileName: string, transformers: Array<ts.TransformerFactory<ts.SourceFile>>) {
  const content = readFileSync(resolve(fixtures, fileName), 'utf-8');
  return transformContent(content, transformers);
}

export function transformContent(content: string, transformers: Array<ts.TransformerFactory<ts.SourceFile>>) {
  const sourceFile = ts.createSourceFile('test.ts', content, ts.ScriptTarget.Latest, true);
  const sfTransformed = ts.transform(sourceFile, transformers).transformed[0];
  return printFileContent(sfTransformed);
}
