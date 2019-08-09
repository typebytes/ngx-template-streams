import { QueryList, ViewChildren } from '@angular/core';
import { merge, of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { createEventStream, createPropertyKey, patchLifecycleHook } from '../utils/decorator-helpers';
import { ObservableEventError } from '../utils/errors';
import { LifecycleHook } from '../utils/models';

export function ObservableChildren<T>(selector: any, event: string, options: AddEventListenerOptions = {}) {
  return (target: any, propertyKey: string | symbol) => {
    const queryListProperty = createPropertyKey(propertyKey);

    ViewChildren(selector)(target, queryListProperty);

    const onDestroy$ = new Subject<void>();

    patchLifecycleHook(target, LifecycleHook.ngOnDestroy, function() {
      onDestroy$.next();
      onDestroy$.complete();
    });

    patchLifecycleHook(target, LifecycleHook.ngAfterViewInit, function() {
      const queryList: QueryList<any> = this[queryListProperty];

      this[propertyKey] = merge(of(queryList), queryList.changes).pipe(
        switchMap((items: QueryList<any>) => {
          const eventStreams = items.map((item: any) => {
            const { stream$, error } = createEventStream(item, event, options, onDestroy$);

            if (error) {
              throw new ObservableEventError('ObservableChildren', event, selector.name, error.message);
            }

            return stream$;
          });

          return merge(...eventStreams);
        }),
        takeUntil(onDestroy$)
      );
    });
  };
}
