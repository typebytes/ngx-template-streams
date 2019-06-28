import Plugin from './plugin';
import * as webpack from 'webpack';
import { AngularCompilerPlugin } from '@ngtools/webpack';
import { resolve } from 'path';
import { templateStreamTransformer } from './transformer';
import * as ts from 'typescript';

const fixtures = resolve(__dirname, '../fixtures');

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

  it('should remove existing AngularCompilerPlugin and insert new one', () => {
    const webpackConfig: webpack.Configuration = {
      plugins: [angularCompilerPlugin]
    };

    const config = Plugin.config(webpackConfig);

    const updatedPlugin = config.plugins[0] as AngularCompilerPlugin;
    const hasOldPlugin = !!config.plugins.find(plugin => plugin === angularCompilerPlugin);

    expect(hasOldPlugin).toBe(false);
    expect(updatedPlugin).not.toEqual(angularCompilerPlugin);
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

  it('should add template transformer', () => {
    const webpackConfig: webpack.Configuration = {
      plugins: [angularCompilerPlugin]
    };

    const config = Plugin.config(webpackConfig);
    const updatedPlugin = config.plugins[0] as AngularCompilerPlugin;

    const hasTemplateTransformer = (updatedPlugin as any)._transformers.find(
      (fn: ts.Transformer<any>) => fn === templateStreamTransformer
    );

    expect(hasTemplateTransformer).toBeDefined();
  });
});
