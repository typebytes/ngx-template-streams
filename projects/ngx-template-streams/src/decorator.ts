import { Observable, pipe, Subject, UnaryFunction } from 'rxjs';

export function ObservableEvent<T>(subjectOrSubjectFactory?: Subject<T> | (() => Subject<T>)) {
  return (target: any, propertyKey: string | symbol) => {
    let value = undefined;

    const subjectFactory = createSubjectFactory(subjectOrSubjectFactory);
    const eventSource$ = subjectFactory();

    Object.defineProperty(target, propertyKey, {
      get() {
        return value;
      },
      set(propertyValue: any) {
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

function createSubjectFactory<T>(subjectOrSubjectFactory: Subject<T> | (() => Subject<T>) = new Subject()) {
  let subjectFactory: () => Subject<T>;

  if (typeof subjectOrSubjectFactory === 'function') {
    subjectFactory = subjectOrSubjectFactory;
  } else {
    subjectFactory = function subjectFactory() {
      return subjectOrSubjectFactory;
    };
  }

  return subjectFactory;
}
