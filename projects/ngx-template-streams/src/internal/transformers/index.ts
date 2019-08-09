import { addLifecycleHooksTransformer } from './add-lifecycle-hooks';
import { addSourcePropertiesTransformer } from './add-source-properties';
import { addViewDecoratorsTransformer } from './add-view-decorators';
import { inlineTemplateTransformer } from './transform-inline-template';

export const jitTransformers = [inlineTemplateTransformer];

export const aotTransformers = [
  inlineTemplateTransformer,
  addSourcePropertiesTransformer,
  addLifecycleHooksTransformer,
  addViewDecoratorsTransformer
];
