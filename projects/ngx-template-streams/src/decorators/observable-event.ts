import { Subject } from 'rxjs';
import { createSubjectFactory, patchLifecycleHook } from '../utils/decorator-helpers';
import { LifecycleHook } from '../utils/models';

export function ObservableEvent<T>(subjectOrSubjectFactory?: Subject<T> | (() => Subject<T>)): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const eventStream = Symbol();
    const eventSource = `__${String(propertyKey)}`;
    const _eventSource = Symbol();

    patchLifecycleHook(target, LifecycleHook.ngOnDestroy, function() {
      const eventSource$ = this[eventSource];
      eventSource$.complete();
    });

    Object.defineProperty(target, eventSource, {
      get() {
        if (!this[_eventSource]) {
          const subjectFactory = createSubjectFactory(subjectOrSubjectFactory);
          const eventSource$ = subjectFactory();
          this[_eventSource] = eventSource$;
        }

        return this[_eventSource];
      }
    });

    return {
      get() {
        if (!this[eventStream]) {
          const eventSource$ = this[eventSource];
          this[eventStream] = eventSource$.asObservable();
        }

        return this[eventStream];
      },
      set(newValue: any) {
        console.warn(
          `[ObservableEvent] It is not recommended to reassign '${String(
            propertyKey
          )}'. This might cause unexpected behavior.`
        );

        this[eventStream] = newValue;
      }
    };
  };
}
