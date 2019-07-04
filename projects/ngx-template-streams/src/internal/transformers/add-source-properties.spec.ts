import { resolve } from 'path';
import { fixtures, getFixtureFactory } from '../../testing/test-helpers';
import { transform } from '../../testing/ts-compiler';
import * as transformer from './add-source-properties';

const getComponentFixture = getFixtureFactory('component');
const getFixture = getFixtureFactory();

describe('AddSourcePropertiesTransformer', () => {
  let transformerSpy: jest.SpyInstance;

  beforeEach(() => {
    transformerSpy = jest.spyOn(transformer, 'addSourcePropertiesTransformer');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not apply transformation if the file is empty', () => {
    const { sourceFile } = getFixture('empty-file');

    const output = transform(resolve(fixtures, sourceFile), [transformer.addSourcePropertiesTransformer]);

    expect(output).toMatchSnapshot();
    expect(transformerSpy).toHaveBeenCalled();
  });

  it('should add source properties for each observable event', () => {
    const { sourceFile } = getComponentFixture('full-example');

    const output = transform(resolve(fixtures, sourceFile), [transformer.addSourcePropertiesTransformer]);

    expect(output).toMatchSnapshot();
  });

  it('should return original source file if it has no observable events', () => {
    const { sourceFile } = getComponentFixture('empty');

    const output = transform(resolve(fixtures, sourceFile), [transformer.addSourcePropertiesTransformer]);

    expect(output).toMatchSnapshot();
  });

  it('should transform multiple classes in a single file', () => {
    const { sourceFile } = getFixture('multiple-classes');

    const output = transform(resolve(fixtures, sourceFile), [transformer.addSourcePropertiesTransformer]);

    expect(output).toMatchSnapshot();
  });
});
