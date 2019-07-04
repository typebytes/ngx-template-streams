import { AngularCompilerPlugin } from '@ngtools/webpack';
import { resolve } from 'path';
import * as ts from 'typescript';
import * as webpack from 'webpack';
import { fixtures } from '../testing/test-helpers';
import Plugin, { JIT_MODE } from './plugin';
import { inlineTemplateTransformer } from './transformers';

describe('Plugin', () => {
  let angularCompilerPlugin: AngularCompilerPlugin;

  beforeEach(() => {
    angularCompilerPlugin = new AngularCompilerPlugin({
      tsConfigPath: resolve(fixtures, 'tsconfig.json')
    });
  });

  it('should throw if AngularCompilerPlugin cannot be found', () => {
    const webpackConfig: webpack.Configuration = {};

    expect(() => {
      Plugin.config(webpackConfig);
    }).toThrow('Could not inject TypeScript Transformer: Webpack AngularCompilerPlugin not found');
  });

  it('should remove existing AngularCompilerPlugin and insert new instance', () => {
    const webpackConfig: webpack.Configuration = {
      plugins: [angularCompilerPlugin]
    };

    const config = Plugin.config(webpackConfig);

    const updatedPlugin = config.plugins[0] as AngularCompilerPlugin;
    const hasOldPlugin = !!config.plugins.find(plugin => plugin === angularCompilerPlugin);

    expect(hasOldPlugin).toBe(false);
    expect(updatedPlugin).not.toEqual(angularCompilerPlugin);
    expect(updatedPlugin.options).toMatchObject(angularCompilerPlugin.options);
    expect(updatedPlugin instanceof AngularCompilerPlugin).toBe(true);
  });

  it('should disable directTemplateLoading', () => {
    const webpackConfig: webpack.Configuration = {
      plugins: [angularCompilerPlugin]
    };

    const config = Plugin.config(webpackConfig);
    const updatedPlugin = config.plugins[0] as AngularCompilerPlugin;

    expect(updatedPlugin.options.directTemplateLoading).toBe(false);
  });

  it('should add inlineTemplateTransformer in JIT mode', () => {
    angularCompilerPlugin[JIT_MODE] = true;

    const webpackConfig: webpack.Configuration = {
      plugins: [angularCompilerPlugin]
    };

    const config = Plugin.config(webpackConfig);
    const updatedPlugin = config.plugins[0] as AngularCompilerPlugin;

    const hasTemplateTransformer = (updatedPlugin as any)._transformers.find(
      (fn: ts.Transformer<any>) => fn === inlineTemplateTransformer
    );

    expect(hasTemplateTransformer).toBeDefined();
  });

  it('should disable forkTypeChecker in AOT mode', () => {
    angularCompilerPlugin[JIT_MODE] = false;

    const webpackConfig: webpack.Configuration = {
      plugins: [angularCompilerPlugin]
    };

    const config = Plugin.config(webpackConfig);
    const updatedPlugin = config.plugins[0] as AngularCompilerPlugin;

    expect(updatedPlugin.options.forkTypeChecker).toBe(false);
  });
});
