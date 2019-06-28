import { rawSource } from '../testing/test-helpers';
import * as engine from './event-binding-engine';
import templateStreamLoader from './loader';

describe('Loader', () => {
  let updateEventBindingSpy: jest.SpyInstance;
  let loader: typeof templateStreamLoader;

  beforeEach(() => {
    updateEventBindingSpy = jest.spyOn(engine, 'updateEventBindings');

    loader = templateStreamLoader.bind({
      cacheable: () => {}
    });
  });

  it('should not call engine for empty source', () => {
    const source = '';

    const result = loader(source);

    expect(updateEventBindingSpy).not.toHaveBeenCalled();
    expect(result).toEqual(source);
  });

  it('should not call engine for incorrect source', () => {
    const source = rawSource`
      module.exports = foo"
    `;

    const result = loader(source);

    expect(updateEventBindingSpy).not.toHaveBeenCalled();
    expect(result).toEqual(source);
  });

  it('should call event binding engine for correct source', () => {
    const template = 'foo';
    const source = rawSource`
      module.exports = "${template}"
    `;

    const result = loader(source);

    expect(updateEventBindingSpy).toHaveBeenCalledWith(template);
    expect(result).toEqual(source);
  });

  it('should perserve arbitrary module export', () => {
    const template = 'foo';
    const source = rawSource`
      export default "${template}"
    `;

    const result = loader(source);

    expect(updateEventBindingSpy).toHaveBeenCalledWith(template);
    expect(result).toEqual(source);
  });
});
