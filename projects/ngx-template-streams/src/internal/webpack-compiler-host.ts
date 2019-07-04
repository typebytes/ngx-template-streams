import { OnErrorFn, WebpackCompilerHost } from '@ngtools/webpack/src/compiler_host';
import { tsquery } from '@phenomnomnominal/tsquery';
import * as ts from 'typescript';
import { printFileContent } from '../utils/ts-helpers';
import { addSourcePropertiesTransformer, inlineTemplateTransformer } from './transformers';

const COMPONENT_DECORATOR_QUERY = 'ClassDeclaration:has(Decorator:has(Identifier[name="Component"]))';

export function getSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: OnErrorFn): ts.SourceFile {
  const p = this.resolve(fileName);

  try {
    const cached = this._sourceFileCache.get(p);
    if (cached) {
      return cached;
    }

    const isAOT = getResourceLoader(this);
    const content = this.readFile(fileName);

    if (content !== undefined) {
      let sf = ts.createSourceFile(fileName, content, languageVersion, true);

      if (isAOT && isComponentFile(sf)) {
        const aotTransformers = [inlineTemplateTransformer, addSourcePropertiesTransformer];
        const sfTransformed = ts.transform(sf, aotTransformers).transformed[0];
        const newFileContent = printFileContent(sfTransformed);
        sf = ts.createSourceFile(fileName, newFileContent, languageVersion);
      }

      if (this.cacheSourceFiles) {
        this._sourceFileCache.set(p, sf);
      }

      return sf;
    }
  } catch (e) {
    if (onError) {
      onError(e.message);
    }
  }

  return undefined;
}

function getResourceLoader(host: WebpackCompilerHost) {
  return host['_resourceLoader'];
}

function isComponentFile(sourceFile: ts.SourceFile) {
  return !!tsquery(sourceFile, COMPONENT_DECORATOR_QUERY).length;
}
