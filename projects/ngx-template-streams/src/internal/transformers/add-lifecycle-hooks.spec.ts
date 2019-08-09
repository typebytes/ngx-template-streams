import { createFileContent } from '../../testing/test-helpers';
import { transformContent } from '../../testing/ts-compiler';
import * as transformer from './add-lifecycle-hooks';

describe('addLifecycleHooksTransformer', () => {
  let transformerSpy: jest.SpyInstance;

  beforeEach(() => {
    transformerSpy = jest.spyOn(transformer, 'addLifecycleHooksTransformer');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not apply transformation if the file is empty', () => {
    const content = '';

    const output = transformContent(content, [transformer.addLifecycleHooksTransformer]);

    expect(output).toMatchSnapshot();
    expect(transformerSpy).toHaveBeenCalled();
  });

  it('should not apply transformation if class doesn not contain known decorators', () => {
    const content = createFileContent`
      @Component()
      class TestComponent {}
    `;

    const output = transformContent(content, [transformer.addLifecycleHooksTransformer]);

    expect(output).toMatchSnapshot();
    expect(transformerSpy).toHaveBeenCalled();
  });

  describe('ngOnDestroy', () => {
    it('should not add ngOnDestroy for unknown decorators', () => {
      const content = createFileContent`
          @Component()
          class TestComponent {
            @Input() myInput: number;
            @Output() myOutput = new EventEmitter();
            @ViewChild('test', { static: true }) testElement;
          }
        `;

      const output = transformContent(content, [transformer.addLifecycleHooksTransformer]);

      expect(output).toMatchSnapshot();
      expect(transformerSpy).toHaveBeenCalled();
    });

    test.each(['ObservableEvent', 'ObservableChild', 'ObservableChildren'])(
      'should add ngOnDestroy if it does not exist › %s',
      decorator => {
        const content = createFileContent`
          @Component()
          class TestComponent {
            @${decorator}()
            stream$: Observable<any>;
          }
        `;

        const output = transformContent(content, [transformer.addLifecycleHooksTransformer]);

        expect(output).toMatchSnapshot();
        expect(transformerSpy).toHaveBeenCalled();
      }
    );

    test.each(['ObservableEvent', 'ObservableChild', 'ObservableChildren'])(
      'should not add ngOnDestroy if it exists › %s',
      decorator => {
        const content = createFileContent`
          @Component()
          class TestComponent {
            @${decorator}()
            stream$: Observable<any>;

            ngOnDestroy() {
              console.log('test');
            }
          }
        `;

        const output = transformContent(content, [transformer.addLifecycleHooksTransformer]);

        expect(output).toMatchSnapshot();
        expect(transformerSpy).toHaveBeenCalled();
      }
    );
  });

  describe('ngAfterViewInit', () => {
    it('should add ngAfterViewInit if it does not exist', () => {
      const content = createFileContent`
        @Component()
        class TestComponent {
          @ObservableChildren()
          stream$: Observable<any>;
        }
      `;

      const output = transformContent(content, [transformer.addLifecycleHooksTransformer]);

      expect(output).toMatchSnapshot();
      expect(transformerSpy).toHaveBeenCalled();
    });

    it('should not add ngAfterViewInit if it exists', () => {
      const content = createFileContent`
        @Component()
        class TestComponent {
          @ObservableChildren()
          stream$: Observable<any>;

          ngAfterViewInit() {
            console.log('test');
          }
        }
      `;

      const output = transformContent(content, [transformer.addLifecycleHooksTransformer]);

      expect(output).toMatchSnapshot();
      expect(transformerSpy).toHaveBeenCalled();
    });

    test.each(['ObservableEvent', 'ObservableChild'])('should not add ngAfterViewInit › %s', decorator => {
      const content = createFileContent`
        @Component()
        class TestComponent {
          @${decorator}()
          stream$: Observable<any>;
        }
      `;

      const output = transformContent(content, [transformer.addLifecycleHooksTransformer]);

      expect(output).toMatchSnapshot();
      expect(transformerSpy).toHaveBeenCalled();
    });
  });
});
