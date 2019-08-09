import { createFileContent } from '../../testing/test-helpers';
import { transformContent } from '../../testing/ts-compiler';
import * as transformer from './add-view-decorators';

describe('addViewDecoratorsTransformer', () => {
  let transformerSpy: jest.SpyInstance;

  beforeEach(() => {
    transformerSpy = jest.spyOn(transformer, 'addViewDecoratorsTransformer');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // no import declaration
  // import decl, but no view child / children
  // with other imports
  // multiple classes
  // test various query options

  it('should not apply transformation if the file is empty', () => {
    const content = '';

    const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

    expect(output).toMatchSnapshot();
    expect(transformerSpy).toHaveBeenCalled();
  });

  describe('imports', () => {
    describe('should not add import declaration', () => {
      test('when no component is defined', () => {
        const content = createFileContent`
          class TestComponent {}
        `;

        const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

        expect(output).toMatchSnapshot();
        expect(transformerSpy).toHaveBeenCalled();
      });

      test('when decorator is not used', () => {
        const content = createFileContent`
          import { Component } from '@angular/core';

          @Component()
          class TestComponent {}
        `;

        const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

        expect(output).toMatchSnapshot();
        expect(transformerSpy).toHaveBeenCalled();
      });
    });

    describe('when import declaration is missing', () => {
      test.each(['ObservableChild', 'ObservableChildren'])(
        'should add a new import declaration at the top › %s',
        decorator => {
          const content = createFileContent`
            import { bar } from 'some/path';

            @Component()
            class TestComponent {
              @${decorator}('foo', 'click')
              foo$: Observable<any>;
            }
          `;

          const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

          expect(output).toMatchSnapshot();
          expect(transformerSpy).toHaveBeenCalled();
        }
      );
    });

    it('should add ViewChild and ViewChildren import specifier', () => {
      const content = createFileContent`
        @Component()
        class TestComponent {
          @ObservableChild('foo', 'click')
          foo$: Observable<any>;

          @ObservableChildren('foo', 'click')
          bar$: Observable<any>;
        }
      `;

      const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

      expect(output).toMatchSnapshot();
      expect(output).toContain('ViewChild');
      expect(output).toContain('ViewChildren');
      expect(transformerSpy).toHaveBeenCalled();
    });

    describe('when core import exists', () => {
      test.each(['ObservableChild', 'ObservableChildren'])(
        'should add import specifier to existing import declaration › %s',
        decorator => {
          const content = createFileContent`
            import { Component } from '@angular/core';

            @Component()
            class TestComponent {
              @${decorator}('foo', 'click')
              foo$: Observable<any>;
            }
          `;

          const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

          expect(output).toMatchSnapshot();
          expect(output).toContain(decorator);
          expect(transformerSpy).toHaveBeenCalled();
        }
      );

      test.each(['ObservableChild', 'ObservableChildren'])(
        'should add import specifier to an empty import statement › %s',
        decorator => {
          const content = createFileContent`
            import {} from '@angular/core';

            @Component()
            class TestComponent {
              @${decorator}('foo', 'click')
              foo$: Observable<any>;
            }
          `;

          const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

          expect(output).toMatchSnapshot();
          expect(transformerSpy).toHaveBeenCalled();
        }
      );

      test.each(['ObservableChild', 'ObservableChildren'])('should not change the order › %s', decorator => {
        const content = createFileContent`
          import { foo } from 'some/path';
          import { Component } from '@angular/core';
          import { of } from 'rxjs';

          @Component()
          class TestComponent {
            @${decorator}('foo', 'click')
            foo$: Observable<any>;
          }
        `;

        const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

        expect(output).toMatchSnapshot();
        expect(transformerSpy).toHaveBeenCalled();
      });
    });

    describe('multiple classes', () => {
      it('should add imports only once', () => {
        const content = createFileContent`
          import { Component } from '@angular/core';

          @Component()
          class TestComponent {
            @ObservableChild('foo', 'click')
            foo$: Observable<any>;

            @ObservableChildren('bar', 'click')
            bar$: Observable<any>;
          }

          @Component()
          class TestComponent {
            @ObservableChild('foo', 'click')
            foo$: Observable<any>;

            @ObservableChildren('bar', 'click')
            bar$: Observable<any>;
          }
        `;

        const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

        expect(output).toMatchSnapshot();
        expect(transformerSpy).toHaveBeenCalled();
      });

      it('should add imports needed for each class', () => {
        const content = createFileContent`
          import { Component } from '@angular/core';

          @Component()
          class TestComponent {
            @ObservableChild('foo', 'click')
            foo$: Observable<any>;
          }

          @Component()
          class TestComponent {
            @ObservableChildren('bar', 'click')
            bar$: Observable<any>;
          }
        `;

        const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

        expect(output).toMatchSnapshot();
        expect(transformerSpy).toHaveBeenCalled();
      });
    });
  });

  describe('ObservableChild', () => {
    it('should add default query options if not specified otherwise', () => {
      const content = createFileContent`
        import { Component } from '@angular/core';

        @Component()
        class TestComponent {
          @ObservableChild('foo', 'click')
          foo$: Observable<any>;
        }
      `;

      const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

      expect(output).toMatchSnapshot();
      expect(transformerSpy).toHaveBeenCalled();
    });

    it('should not overwrite user options', () => {
      const content = createFileContent`
        import { Component } from '@angular/core';

        @Component()
        class TestComponent {
          @ObservableChild('foo', 'click', { static: true, read: ElementRef })
          foo$: Observable<any>;
        }
      `;

      const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

      expect(output).toMatchSnapshot();
      expect(transformerSpy).toHaveBeenCalled();
    });

    it('should only apply valid query options', () => {
      const content = createFileContent`
        import { Component } from '@angular/core';

        @Component()
        class TestComponent {
          @ObservableChild('foo', 'click', { static: true, read: ElementRef, once: false, passive: true })
          foo$: Observable<any>;
        }
      `;

      const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

      expect(output).toMatchSnapshot();
      expect(transformerSpy).toHaveBeenCalled();
    });

    it('should work with component as selector', () => {
      const content = createFileContent`
        import { Component } from '@angular/core';

        @Component()
        class TestComponent {
          @ObservableChild(FooComponent, 'someOutput')
          foo$: Observable<any>;
        }
      `;

      const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

      expect(output).toMatchSnapshot();
      expect(transformerSpy).toHaveBeenCalled();
    });
  });

  describe('ObservableChildren', () => {
    it('should add property decorated with ViewChildren', () => {
      const content = createFileContent`
        import { Component } from '@angular/core';

        @Component()
        class TestComponent {
          @ObservableChildren('foo', 'click')
          foo$: Observable<any>;
        }
      `;

      const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

      expect(output).toMatchSnapshot();
      expect(transformerSpy).toHaveBeenCalled();
    });

    it('should add as many properties as observable children exist', () => {
      const content = createFileContent`
        import { Component } from '@angular/core';

        @Component()
        class TestComponent {
          @ObservableChildren('foo', 'click')
          foo$: Observable<any>;

          @ObservableChildren('bar', 'click')
          bar$: Observable<any>;

          @ObservableChildren(FooBarComponent, 'myOutput')
          foobar$: Observable<any>;
        }
      `;

      const output = transformContent(content, [transformer.addViewDecoratorsTransformer]);

      expect(output).toMatchSnapshot();
      expect(transformerSpy).toHaveBeenCalled();
    });
  });
});
