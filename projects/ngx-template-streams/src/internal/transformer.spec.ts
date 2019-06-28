import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as rimraf from 'rimraf';
import { getFixtureFactory } from '../testing/test-helpers';
import compile from '../testing/ts-compiler';
import * as engine from './event-binding-engine';
import * as transformer from './transformer';

const outputDir = resolve(__dirname, '../__test__');
const fixtures = resolve(__dirname, '../fixtures');

const getComponentFixture = getFixtureFactory('component');

describe('Transformer', () => {
  let transformerSpy: jest.SpyInstance;
  let updateEventBindingsSpy: jest.SpyInstance;

  beforeEach(() => {
    transformerSpy = jest.spyOn(transformer, 'templateStreamTransformer');
    updateEventBindingsSpy = jest.spyOn(engine, 'updateEventBindings');
  });

  afterEach(() => {
    rimraf.sync(outputDir);
    jest.restoreAllMocks();
  });

  it('should apply transformation to inline template', () => {
    const { sourceFile, outputFile } = getComponentFixture('inline-template');

    compile(resolve(fixtures, sourceFile), [transformer.templateStreamTransformer]);

    const output = readFileSync(resolve(outputDir, outputFile), 'utf-8');

    expect(output).toMatchSnapshot();
    expect(transformerSpy).toHaveBeenCalled();
    expect(updateEventBindingsSpy).toHaveBeenCalled();
  });

  it('should not apply transformation to external template', () => {
    const { sourceFile, outputFile } = getComponentFixture('external-template');

    compile(resolve(fixtures, sourceFile), [transformer.templateStreamTransformer]);

    const output = readFileSync(resolve(outputDir, outputFile), 'utf-8');

    expect(output).toMatchSnapshot();
    expect(updateEventBindingsSpy).not.toHaveBeenCalled();
  });
});
