import { ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { createEventStream, createPropertyKey, patchLifecycleHook } from '../utils/decorator-helpers';
import { ObservableEventError } from '../utils/errors';
import { LifecycleHook } from '../utils/models';
import { pick } from '../utils/object-helpers';

interface QueryOptions {
  static: boolean;
  read: any;
}

export function ObservableChild(
  selector: any,
  event: string,
  options: AddEventListenerOptions & Partial<QueryOptions> = {}
) {
  return (target: any, propertyKey: string | symbol) => {
    const elementRefProperty = createPropertyKey(propertyKey);
    const refKey = Symbol();
    const eventBusKey = Symbol();

    const onDestroy$ = new Subject<void>();

    const queryOptions = getQueryOptions(pick(options, ['static', 'read']));
    ViewChild(selector, queryOptions)(target, elementRefProperty);

    patchLifecycleHook(target, LifecycleHook.ngOnDestroy, function() {
      onDestroy$.next();

      const eventBus = this[eventBusKey];

      if (eventBus) {
        eventBus.complete();
        this[eventBusKey] = null;
      }
    });

    Object.defineProperty(target, elementRefProperty, {
      get() {
        return this[refKey];
      },
      set(elementRef: any) {
        this[refKey] = elementRef;

        if (!elementRef) {
          return;
        }

        if (!this[eventBusKey]) {
          this[eventBusKey] = new Subject();
        }

        const { stream$, error } = createEventStream(elementRef, event, options, onDestroy$);

        if (error) {
          throw new ObservableEventError('ObservableChild', event, selector.name, error.message);
        }

        const eventBus$ = this[eventBusKey];

        // subscribe and use subject to multicast events
        stream$.subscribe({
          next: value => eventBus$.next(value),
          error: error => eventBus$.error(error)
        });

        this[propertyKey] = eventBus$.asObservable();
      }
    });
  };
}

function getQueryOptions(options: Partial<QueryOptions> = {}) {
  return { static: options.static === true, ...options };
}
