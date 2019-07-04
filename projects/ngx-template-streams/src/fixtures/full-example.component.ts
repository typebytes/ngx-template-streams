import { Component } from '@angular/core';
import { ObservableEvent } from 'ngx-template-streams';
import { Observable } from 'rxjs';

@Component({
  selector: 'test',
  template: `
    <button (*click)="click$">Click Me</button>
    <input (*focus)="focus$" />
  `,
  styleUrls: ['./app.component.css']
})
export class TestComponent {
  @ObservableEvent()
  click$: Observable<any>;

  @ObservableEvent()
  focus$: Observable<any>;
}
