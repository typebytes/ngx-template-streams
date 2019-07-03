import { createInlineTemplate, createTemplate } from '../testing/test-helpers';
import { updateEventBindings } from './event-binding-engine';

describe('Event Binding Engine', () => {
  it('should work for empty source', () => {
    const source = '';
    const result = updateEventBindings(source);
    expect(result).toEqual(source);
  });

  it('should not transform regular event bindings', () => {
    const source = createTemplate`
      <button (click)="myMethod()">Click Me</button>
    `;

    const result = updateEventBindings(source);
    expect(result).toEqual(source);
  });

  it('should transform simple template stream', () => {
    const source = createTemplate`
      <button (*click)="stream$">Click Me</button>
    `;

    const expected = createTemplate`
      <button (click)="__stream$.next($event)">Click Me</button>
    `;

    const result = updateEventBindings(source);
    expect(result).toEqual(expected);
  });

  it('should transform multiple and deeply nested template streams', () => {
    const source = createTemplate`
      <button (*click)="stream$">Click Me</button>
      <div>
        <div>
          <input (*focus)="focus$" />
        </div>
      </div>
    `;

    const expected = createTemplate`
      <button (click)="__stream$.next($event)">Click Me</button>
      <div>
        <div>
          <input (focus)="__focus$.next($event)" />
        </div>
      </div>
    `;

    const result = updateEventBindings(source);
    expect(result).toEqual(expected);
  });

  test.each([`1`, `'strings work too'`, `{ prop: 1 }`])('should respect various payloads › %s', payload => {
    const source = createTemplate`
        <button (*click)="stream$; $event = ${payload}">Click Me</button>
      `;

    const expected = createTemplate`
        <button (click)="__stream$.next(${payload})">Click Me</button>
      `;

    const result = updateEventBindings(source);
    expect(result).toEqual(expected);
  });

  it('should not escape qutes for inline templates', () => {
    const source = createInlineTemplate`
      <button (*click)="stream$; $event = { myProp: { nestedProp: 1 }}">Click Me</button>
    `;

    const expected = createInlineTemplate`
      <button (click)="__stream$.next({ myProp: { nestedProp: 1 }})">Click Me</button>
    `;

    const result = updateEventBindings(source, true);

    expect(result).toEqual(expected);
  });

  it('should correctly escape dollar signs as part of the event payload', () => {
    const source = createInlineTemplate`
      <button (*click)="stream$; $event = 'test$'">Click Me</button>
    `;

    const expected = createInlineTemplate`
      <button (click)="__stream$.next('test$')">Click Me</button>
    `;

    const result = updateEventBindings(source, true);

    expect(result).toEqual(expected);
  });
});
