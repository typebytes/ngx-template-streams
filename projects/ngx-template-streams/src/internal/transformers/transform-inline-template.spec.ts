import { resolve } from 'path';
import { fixtures, getFixtureFactory } from '../../testing/test-helpers';
import { transformFile } from '../../testing/ts-compiler';
import * as engine from '../event-binding-engine';
import * as transformer from './transform-inline-template';

const getComponentFixture = getFixtureFactory('component');
const getFixture = getFixtureFactory();

describe('inlineTemplateTransformer', () => {
  let transformerSpy: jest.SpyInstance;
  let updateEventBindingsSpy: jest.SpyInstance;

  beforeEach(() => {
    transformerSpy = jest.spyOn(transformer, 'inlineTemplateTransformer');
    updateEventBindingsSpy = jest.spyOn(engine, 'updateEventBindings');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should apply transformation to inline template', () => {
    const { sourceFile } = getComponentFixture('inline-template');

    const output = transformFile(resolve(fixtures, sourceFile), [transformer.inlineTemplateTransformer]);

    expect(output).toMatchSnapshot();
    expect(transformerSpy).toHaveBeenCalled();
    expect(updateEventBindingsSpy).toHaveBeenCalled();
  });

  it('should not apply transformation if component has an external template', () => {
    const { sourceFile } = getComponentFixture('external-template');

    const output = transformFile(resolve(fixtures, sourceFile), [transformer.inlineTemplateTransformer]);

    expect(output).toMatchSnapshot();
    expect(updateEventBindingsSpy).not.toHaveBeenCalled();
  });

  it('should not apply transformation to empty file', () => {
    const { sourceFile } = getFixture('empty-file');

    const output = transformFile(resolve(fixtures, sourceFile), [transformer.inlineTemplateTransformer]);

    expect(output).toMatchSnapshot();
    expect(updateEventBindingsSpy).not.toHaveBeenCalled();
  });

  it('should transform inline template of multiple classes in a single file', () => {
    const { sourceFile } = getFixture('multiple-classes');

    const output = transformFile(resolve(fixtures, sourceFile), [transformer.inlineTemplateTransformer]);

    expect(output).toMatchSnapshot();
    expect(updateEventBindingsSpy).toHaveBeenCalledTimes(2);
  });
});
