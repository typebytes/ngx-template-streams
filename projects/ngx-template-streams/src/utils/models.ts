export type ObservableDecorator = 'ObservableEvent' | 'ObservableChild' | 'ObservableChildren';

export enum LifecycleHook {
  ngOnDestroy = 'ngOnDestroy',
  ngAfterViewInit = 'ngAfterViewInit'
}
