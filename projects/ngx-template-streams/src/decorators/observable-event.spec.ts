import { OnDestroy, OnInit } from '@angular/core';
import { AsyncSubject, BehaviorSubject, noop, Observable, of, Subject } from 'rxjs';
import { ObservableEvent } from './observable-event';

describe('@ObservableEvent', () => {
  let definePropertySpy: jest.SpyInstance;

  beforeEach(() => {
    definePropertySpy = jest.spyOn(Object, 'defineProperty');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when property is decorated', () => {
    it('should create event source', () => {
      class TestClass {
        @ObservableEvent()
        stream$: Observable<any>;
      }

      const test = new TestClass();
      const subject = getSubject(test, '__stream$');

      expect(subject).toBeDefined();
    });
  });

  describe('when property is read', () => {
    it('should create event stream', () => {
      class TestClass {
        @ObservableEvent()
        stream$: Observable<any>;

        // trigger event stream creation
        eventStream = this.stream$;
      }

      const test = new TestClass();
      const subject = getSubject(test, '__stream$');
      const eventStream = test.stream$;

      expect(eventStream).toBeDefined();
      expect(eventStream instanceof Observable).toBe(true);
      expect(eventStream).toEqual(subject.asObservable());
    });
  });

  describe('when property is reassigned', () => {
    it('should print warning', () => {
      class TestClass {
        @ObservableEvent()
        stream$: Observable<any> = of(1);
      }

      jest.spyOn(console, 'warn').mockImplementation();

      const test = new TestClass();

      expect(console.warn).toHaveBeenCalledWith(
        `[ObservableEvent] It is not recommended to reassign 'stream$'. This might cause unexpected behavior.`
      );
    });
  });

  describe('when event source is overwritten', () => {
    test.each`
      source                         | type               | name
      ${new BehaviorSubject('test')} | ${BehaviorSubject} | ${'Raw'}
      ${() => new AsyncSubject()}    | ${AsyncSubject}    | ${'Subject Factory'}
    `('should allow to change the underlying event source › $name', ({ source, type }) => {
      class TestClass {
        @ObservableEvent(source)
        stream$: Observable<any>;

        triggerEventStream = this.stream$;
      }

      const test = new TestClass();
      const subject = getSubject(test, '__stream$');

      expect(subject instanceof type).toBeTruthy();
    });
  });

  describe('when destroyed', () => {
    it('should destroy subject and call original ngOnDeytroy', () => {
      const onCompleteSpy = jest.fn();

      class TestClass implements OnInit, OnDestroy {
        @ObservableEvent()
        stream$: Observable<any>;

        someProperty = 'foo';

        ngOnInit() {
          this.stream$.subscribe(noop, noop, onCompleteSpy);
        }

        ngOnDestroy() {
          this.someProperty = 'bar';
        }
      }

      const test = new TestClass();
      test.ngOnInit();

      const originalOnDestroy = jest.spyOn(test, 'ngOnDestroy');

      let subject = getSubject(test, '__stream$');
      subject.subscribe(noop, noop, onCompleteSpy);

      // call ngOnDestroy to simulate that the component is destroyed
      test.ngOnDestroy();

      expect(subject.isStopped).toBe(true);
      expect(originalOnDestroy).toHaveBeenCalled();
      expect(onCompleteSpy).toHaveBeenCalledTimes(2);
      expect(test.someProperty).toBe('bar');
    });
  });

  describe('when target is instantiated multiple times', () => {
    it('should create different event streams', () => {
      class TestClass {
        @ObservableEvent()
        stream$: Observable<any>;

        testProp = this.stream$;
      }

      const test_1 = new TestClass();
      const test_2 = new TestClass();

      expect(test_1.stream$).not.toBe(test_2.stream$);
    });
  });
});

function getSubject<T>(classInstance: T, propertyName: string): Subject<any> {
  return classInstance[propertyName];
}
