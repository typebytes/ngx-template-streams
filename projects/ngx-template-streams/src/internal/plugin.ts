import { AngularCompilerPlugin, AngularCompilerPluginOptions } from '@ngtools/webpack';
import { WebpackCompilerHost } from '@ngtools/webpack/src/compiler_host';
import * as webpack from 'webpack';
import { inlineTemplateTransformer } from './transformers';
import { getSourceFile } from './webpack-compiler-host';

/**
 * For AOT we have to patch the WebpackCompilerHost's getSourceFile method to run source code transformations
 * before the compiler generates AOT artifacts (both Ivy and ViewEngine).
 * Platform transformers are called too late in the pipeline.
 * See https://github.com/angular/angular-cli/blob/master/packages/ngtools/webpack/src/compiler_host.ts#L265-L291
 */
WebpackCompilerHost.prototype.getSourceFile = getSourceFile;

export default {
  config(config: webpack.Configuration) {
    const angularCompilerPlugin = findAngularCompilerPlugin(config) as AngularCompilerPlugin;

    if (!angularCompilerPlugin) {
      throw new Error('Could not inject TypeScript Transformer: Webpack AngularCompilerPlugin not found');
    }

    const jitMode = isJitMode(angularCompilerPlugin);

    // Turn off direct template loading. By default this option is `true`, causing
    // the plugin to load component templates (HTML) directly from the filesystem.
    // This is more efficient than using the raw-loader. However, if we want to add
    // a custom html-loader we have to turn off direct template loading. To do so
    // we have to remove the old compiler plugin and create a new instance with
    // updated options.

    // We also don't run the TypeChecker in a forked process when AOT is enabled.
    // Because of template and class transformations this results in type errors.
    // TODO: This needs a bit further investigation.

    const options: AngularCompilerPluginOptions = {
      ...angularCompilerPlugin.options,
      directTemplateLoading: false,
      forkTypeChecker: jitMode
    };

    config.plugins = removeCompilerPlugin(config.plugins, angularCompilerPlugin);

    const newCompilerPlugin = new AngularCompilerPlugin(options);

    if (jitMode) {
      // Warning: this method is *not* pure and modifies the array of transformers directly
      addTransformer(newCompilerPlugin, inlineTemplateTransformer);
    }

    config.plugins.push(newCompilerPlugin);

    return config;
  }
};

function findAngularCompilerPlugin(config: webpack.Configuration) {
  return config.plugins && config.plugins.find(isAngularCompilerPlugin);
}

function isAngularCompilerPlugin(plugin: webpack.Plugin) {
  return plugin instanceof AngularCompilerPlugin;
}

function addTransformer(acp: any, transformer: any): void {
  // The AngularCompilerPlugin has no public API to add transformers, use private API _transformers instead
  acp._transformers = [transformer, ...acp._transformers];
}

function removeCompilerPlugin(plugins: webpack.Plugin[], acp: webpack.Plugin) {
  return plugins.filter(plugin => plugin != acp);
}

function isJitMode(plugin: AngularCompilerPlugin) {
  return plugin['_JitMode'];
}
