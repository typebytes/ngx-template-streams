import { Component } from '@angular/core';

@Component({
  selector: 'test',
  template: `
    <button (*click)="click$; $event = 'the payload'">Click Me</button>
  `,
  styleUrls: ['./app.component.css']
})
export class TestComponent {}
