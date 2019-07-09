import { Observable, Subject } from 'rxjs';

export function ObservableEvent<T>(subjectOrSubjectFactory?: Subject<T> | (() => Subject<T>)) {
  return (target: any, propertyKey: string | symbol) => {
    let value: Observable<any>;

    const subjectFactory = createSubjectFactory(subjectOrSubjectFactory);
    const eventSource$ = subjectFactory();

    const originalOnDestroy = target.ngOnDestroy;
    target.ngOnDestroy = function() {
      eventSource$.complete();

      if (originalOnDestroy && isFunction(originalOnDestroy)) {
        originalOnDestroy.apply(this, arguments);
      }
    };

    Object.defineProperty(target, propertyKey, {
      get() {
        return value;
      },
      set(propertyValue: Observable<any>) {
        if (!isObservable(propertyValue)) {
          throw new Error(`[ObservableEvent] Value was ${typeof propertyValue} but has to be an Observable.`);
        }

        value = propertyValue;
      },
      enumerable: false,
      configurable: false
    });

    target[propertyKey] = eventSource$.asObservable();
    target[`__${String(propertyKey)}`] = eventSource$;
  };
}

function isObservable(object: any) {
  return object instanceof Observable;
}

function isFunction(fn: any) {
  return typeof fn === 'function';
}

function createSubjectFactory<T>(subjectOrSubjectFactory: Subject<T> | (() => Subject<T>) = new Subject()) {
  let subjectFactory: () => Subject<T>;

  if (typeof subjectOrSubjectFactory === 'function') {
    subjectFactory = subjectOrSubjectFactory;
  } else {
    subjectFactory = () => {
      return subjectOrSubjectFactory;
    };
  }

  return subjectFactory;
}
