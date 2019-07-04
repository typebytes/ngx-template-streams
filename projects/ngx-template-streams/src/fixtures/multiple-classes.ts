import { Component } from '@angular/core';
import { ObservableEvent } from 'ngx-template-streams';
import { Observable } from 'rxjs';

@Component({
  selector: 'a',
  template: '<button (*click)="a$">Test<button>'
})
export class ClassA {
  @ObservableEvent()
  a$: Observable<any>;
}

@Component({
  selector: 'b',
  template: '<button (*click)="b$">Test<button>'
})
export class ClassB {
  @ObservableEvent()
  b$: Observable<any>;
}
