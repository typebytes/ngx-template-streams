import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as ts from 'typescript';
import { fixtures } from '../testing/test-helpers';
import { aotTransformers } from './transformers';
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
  let transformSpy: jest.SpyInstance;

  const enableJIT = () => {
    compilerHost[RESOURCE_LOADER] = null;
  };

  const enableAOT = () => {
    compilerHost[RESOURCE_LOADER] = {};
  };

  const enableCaching = () => {
    compilerHost.cacheSourceFiles = true;
  };

  beforeEach(() => {
    compilerHost = new MockedWebpackCompilerHost();
    patchedGetSourceFile = getSourceFile.bind(compilerHost);

    transformSpy = jest.spyOn(ts, 'transform');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not call transformers in JIT mode', () => {
    enableJIT();

    patchedGetSourceFile('full-example.component.ts', ts.ScriptTarget.Latest);

    expect(transformSpy).not.toHaveBeenCalled();
  });

  it('should not call transformers if the file does not contain a component', () => {
    enableAOT();

    patchedGetSourceFile('empty-file.ts', ts.ScriptTarget.Latest);

    expect(transformSpy).not.toHaveBeenCalled();
  });

  it('should call transformers if AOT is enabled and file contains a component', () => {
    enableAOT();

    patchedGetSourceFile('full-example.component.ts', ts.ScriptTarget.Latest);

    expect(transformSpy).toHaveBeenCalled();
    expect(transformSpy.mock.calls[0][1]).toBe(aotTransformers);
  });

  it('should not call transformers if the file has been cached', () => {
    enableAOT();
    enableCaching();

    const fileName = 'full-example.component.ts';

    const sourceFile = patchedGetSourceFile(fileName, ts.ScriptTarget.Latest);

    expect(transformSpy).toHaveBeenCalled();
    expect(compilerHost._sourceFileCache.get(fileName)).toEqual(sourceFile);

    // reset spies
    transformSpy.mockReset();

    // call again with the same file name
    patchedGetSourceFile(fileName, ts.ScriptTarget.Latest);

    expect(transformSpy).not.toHaveBeenCalled();
  });

  it('should gracefully return if an error occurs', () => {
    const onError = jest.fn();

    const sourceFile = patchedGetSourceFile('does-not-exist', ts.ScriptTarget.Latest, onError);

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toContain('ENOENT: no such file or directory');
    expect(transformSpy).not.toHaveBeenCalled();
    expect(sourceFile).not.toBeDefined();
  });
});
