import { AsyncSubject, BehaviorSubject, Observable, Subject } from 'rxjs';
import { ObservableEvent } from './decorator';

describe('@ObservableEvent Decorator', () => {
  let definePropertySpy: jest.SpyInstance;

  beforeEach(() => {
    definePropertySpy = jest.spyOn(Object, 'defineProperty');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create default Subject on target', () => {
    class TestClass {
      @ObservableEvent()
      stream$: Observable<any>;
    }

    const test = new TestClass();
    const subject = getSubject(test, '__stream$');

    expect(subject).toBeDefined();
    expect(subject instanceof Subject).toBeTruthy();
  });

  it('should define property on target', () => {
    class TestClass {
      @ObservableEvent()
      stream$: Observable<any>;
    }

    const test = new TestClass();
    const targetProperty = test.stream$;

    expect(definePropertySpy).toHaveBeenCalledTimes(1);
    expect(targetProperty).toBeDefined();
    expect(targetProperty instanceof Observable).toBeTruthy();
  });

  test.each([1, 'foo', {}, true])('should not allow values to be assigned › %s', value => {
    class TestClass {
      @ObservableEvent()
      stream$ = value;
    }

    expect(() => {
      const test = new TestClass();
    }).toThrow(`[ObservableEvent] Value was ${typeof value} but has to be an Observable.`);
  });

  test.each`
    source                         | type               | name
    ${new BehaviorSubject('test')} | ${BehaviorSubject} | ${'Raw'}
    ${() => new AsyncSubject()}    | ${AsyncSubject}    | ${'Subject Factory'}
  `('should allow to change the underlying source › $name', ({ source, type }) => {
    class TestClass {
      @ObservableEvent(source)
      stream$: Observable<any>;
    }

    const test = new TestClass();
    const subject = getSubject(test, '__stream$');

    expect(subject instanceof type).toBeTruthy();
  });
});

function getSubject<T>(classInstance: T, propertyName: string): Subject<any> {
  const prototype = Object.getPrototypeOf(classInstance);
  return prototype[propertyName];
}
