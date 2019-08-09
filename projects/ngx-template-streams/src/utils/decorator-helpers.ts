import { ElementRef, EventEmitter, ɵNG_COMPONENT_DEF as NG_COMPONENT_DEF } from '@angular/core';
import { fromEvent, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { INTERNAL_PREFIX } from '../internal/constants';
import { LifecycleHook } from './models';
import { camelize } from './string-helpers';

export function createEventStream(item: any, event: string, options: EventListenerOptions, notifier: Subject<void>) {
  let stream$: Observable<any> | null = null;
  let error: Error | null = null;

  if (item instanceof ElementRef) {
    stream$ = fromEvent(item.nativeElement, event, options).pipe(takeUntil(notifier));
  } else if (item[event] instanceof EventEmitter) {
    const eventEmitter = item[event] as EventEmitter<any>;
    stream$ = eventEmitter.asObservable().pipe(takeUntil(notifier));
  } else {
    error = new Error('Event does not exist.');
  }

  return { stream$, error };
}

export function createSubjectFactory<T>(subjectOrSubjectFactory: Subject<T> | (() => Subject<T>) = new Subject()) {
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

export function isFunction(fn: any) {
  return typeof fn === 'function';
}

export function createPropertyKey(propertyKey: string | symbol) {
  return `${INTERNAL_PREFIX}${String(propertyKey)}`;
}

export function patchLifecycleHook(target: any, hook: LifecycleHook, cb: Function) {
  const componentDef = target.constructor[NG_COMPONENT_DEF];
  const hookTarget = componentDef ? componentDef : target;
  let hookName = componentDef ? getIvyLifecycleHook(hook) : hook;

  const originalHook = hookTarget[hookName];
  hookTarget[hookName] = function() {
    cb.apply(this, arguments);

    if (originalHook && isFunction(originalHook)) {
      originalHook.apply(this, arguments);
    }
  };
}

function getIvyLifecycleHook(hook: LifecycleHook) {
  return camelize(hook.replace('ng', ''));
}
