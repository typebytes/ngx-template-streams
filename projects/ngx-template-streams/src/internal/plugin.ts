import { AngularCompilerPlugin } from '@ngtools/webpack';
import * as webpack from 'webpack';
import { templateStreamTransformer } from './transformer';

export default {
  config(config: webpack.Configuration) {
    const angularCompilerPlugin = findAngularCompilerPlugin(config) as AngularCompilerPlugin;

    if (!angularCompilerPlugin) {
      throw new Error('Could not inject TypeScript Transformer: Webpack AngularCompilerPlugin not found');
    }

    // Turn off direct template loading. By default this option is `true`, causing
    // the plugin to load component templates (HTML) directly from the filesystem.
    // This is more efficient than using the raw-loader. However, if we want to add
    // a custom html-loader we have to turn off direct template loading. To do so
    // we have to remove the old compiler plugin and create a new instance with
    // updated options.

    const options = {
      ...angularCompilerPlugin.options,
      directTemplateLoading: false
    };

    config.plugins = removeCompilerPlugin(config.plugins, angularCompilerPlugin);

    const newCompilerPlugin = new AngularCompilerPlugin(options);

    // Warning: this method is *not* pure and modifies the array of transformers directly
    addTransformer(newCompilerPlugin, templateStreamTransformer);

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
