import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as ts from 'typescript';
import { fixtures } from '../testing/test-helpers';
import * as transformers from './transformers';
import { getSourceFile, RESOURCE_LOADER } from './webpack-compiler-host';

class MockedWebpackCompilerHost {
  /* AOT Flag */
  _resourceLoader = null;

  /* Cache for source files */
  _sourceFileCache = new Map();

  /* Whether or not files should be cached */
  cacheSourceFiles = false;

  resolve(fileName: string) {
    return fileName;
  }

  readFile(fileName: string) {
    return readFileSync(resolve(fixtures, fileName), 'utf-8');
  }
}

describe('WebpackCompilerHost', () => {
  let compilerHost: MockedWebpackCompilerHost;
  let patchedGetSourceFile: typeof getSourceFile;
  let transformInlineTemplateSpy: jest.SpyInstance;
  let addSourcePropertiesSpy: jest.SpyInstance;

  beforeEach(() => {
    compilerHost = new MockedWebpackCompilerHost();
    patchedGetSourceFile = getSourceFile.bind(compilerHost);
    transformInlineTemplateSpy = jest.spyOn(transformers, 'inlineTemplateTransformer');
    addSourcePropertiesSpy = jest.spyOn(transformers, 'addSourcePropertiesTransformer');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not call transformers in JIT mode', () => {
    // enable JIT mode
    compilerHost[RESOURCE_LOADER] = null;

    patchedGetSourceFile('full-example.component.ts', ts.ScriptTarget.Latest);

    expect(transformInlineTemplateSpy).not.toHaveBeenCalled();
    expect(addSourcePropertiesSpy).not.toHaveBeenCalled();
  });

  it('should not call transformers if the file does not contain a component', () => {
    // enable AOT mode
    compilerHost[RESOURCE_LOADER] = {};

    patchedGetSourceFile('empty-file.ts', ts.ScriptTarget.Latest);

    expect(transformInlineTemplateSpy).not.toHaveBeenCalled();
    expect(addSourcePropertiesSpy).not.toHaveBeenCalled();
  });

  it('should call transformers if AOT is enabled and file contains a component', () => {
    patchedGetSourceFile('full-example.component.ts', ts.ScriptTarget.Latest);

    expect(transformInlineTemplateSpy).not.toHaveBeenCalled();
    expect(addSourcePropertiesSpy).not.toHaveBeenCalled();
  });

  it('should not call transformers if the file has been cached', () => {
    // enable caching and AOT
    compilerHost.cacheSourceFiles = true;
    compilerHost[RESOURCE_LOADER] = {};

    const fileName = 'full-example.component.ts';

    const sourceFile = patchedGetSourceFile(fileName, ts.ScriptTarget.Latest);

    expect(transformInlineTemplateSpy).toHaveBeenCalled();
    expect(addSourcePropertiesSpy).toHaveBeenCalled();
    expect(compilerHost._sourceFileCache.get(fileName)).toEqual(sourceFile);

    // reset spies
    transformInlineTemplateSpy.mockReset();
    addSourcePropertiesSpy.mockReset();

    // call again with the same file name
    patchedGetSourceFile(fileName, ts.ScriptTarget.Latest);

    expect(transformInlineTemplateSpy).not.toHaveBeenCalled();
    expect(addSourcePropertiesSpy).not.toHaveBeenCalled();
  });

  it('should not call transformers if the file has been cached', () => {
    const onError = jest.fn();

    const sourceFile = patchedGetSourceFile('does-not-exist', ts.ScriptTarget.Latest, onError);

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toContain('ENOENT: no such file or directory');
    expect(transformInlineTemplateSpy).not.toHaveBeenCalled();
    expect(addSourcePropertiesSpy).not.toHaveBeenCalled();
    expect(sourceFile).not.toBeDefined();
  });
});
