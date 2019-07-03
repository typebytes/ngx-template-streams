import { createTemplate, getParserResultGroups } from '../testing/test-helpers';
import { parseEventBindings } from './event-binding-parser';

describe('Event Binding Parser', () => {
  it('should gracefully return none if input is empty', () => {
    const input = '';
    const result = parseEventBindings(input);
    expect(result.isNone()).toBeTruthy();
  });

  it('should not parse regular event bindings', () => {
    const input = '(click)="callMyMethod($event)"';
    const result = parseEventBindings(input);
    expect(result.isNone()).toBeTruthy();
  });

  it('should parse event bindings globally', () => {
    const input = createTemplate`
      <button (*click)="back$">Back</button>

      <h1>Test Form</h1>

      <form>
        <input name="firstname" type="text" (*input)="firstnameChange$" (*focus)="firstnameFocus$">
        <button (*click)="(submit$)">Submit</button>
      </form>

      <test-component (myOutput)="callMethod($event)"></test-component>
    `;

    const expected = [
      {
        event: 'click',
        stream: 'back$',
        payload: undefined
      },
      {
        event: 'input',
        stream: 'firstnameChange$',
        payload: undefined
      },
      {
        event: 'focus',
        stream: 'firstnameFocus$',
        payload: undefined
      },
      {
        event: 'click',
        stream: 'submit$',
        payload: undefined
      }
    ];

    const result = parseEventBindings(input);

    expect(getParserResultGroups(result)).toEqual(expected);
  });

  test.each(['(click)', 'focus$', '_myStream', '/focus$', '=event'])(
    'should correctly parse special characters in event name › %s',
    event => {
      const input = createTemplate`
      <button (*${event})="stream$">Back</button>
    `;

      const expected = [
        {
          event,
          stream: 'stream$',
          payload: undefined
        }
      ];

      const result = parseEventBindings(input);

      expect(getParserResultGroups(result)).toEqual(expected);
    }
  );

  test.each(['*click', '"click'])('should permit certain characters as part of the event name › %s', event => {
    const input = createTemplate`
      <button (*${event})="stream$">Back</button>
    `;

    const result = parseEventBindings(input);
    expect(result.isNone()).toBeTruthy();
  });

  test.each(['(', ')', 'foo()'])('should permit certain characters as part of the stream name › %s', stream => {
    const input = createTemplate`
      <button (*click)="${stream}">Back</button>
    `;

    const result = parseEventBindings(input);
    expect(result.isNone()).toBeTruthy();
  });

  test.each([
    '(  *click)="stream$"',
    '(*  click)="stream$"',
    '(*click  )="stream$"',
    '(*click)  ="stream$"',
    '(*click)=  "stream$"',
    '(*click)="  stream$"',
    '(*click)="stream$  "',
    '(*click)="stream$ ; $event = 1"',
    '(*click)="stream$;  $event = 1"',
    '(*click)="stream$; $event  = 1"',
    '(*click)="stream$; $event =  1"',
    '(*click)="stream$; $event = 1 "'
  ])('should allow whitespace characters in arbitrary places › %s', binding => {
    const input = createTemplate`
      <button ${binding}>Back</button>
    `;

    const result = parseEventBindings(input);
    expect(result.isNone()).toBeFalsy();
  });

  test.each([
    '1',
    'variables',
    `\'single quote strings are allowed\'`,
    '{ foo: 1, bar = { foobar: 2 } }',
    'string with escape character $'
  ])('should allow for different payloads › %s', payload => {
    const input = createTemplate`
        <button (*click)="stream$; $event = ${payload}">Back</button>
      `;

    const expected = [
      {
        event: 'click',
        stream: 'stream$',
        payload
      }
    ];

    const result = parseEventBindings(input);

    expect(getParserResultGroups(result)).toEqual(expected);
  });

  test.each([';', '; $event', '; $ev ent', '; $ event', '; $event ='])(
    'should not parse binding if payload syntax is incorrect › %s',
    payload => {
      const input = createTemplate`
        <button (*click)="stream$ ${payload}">Back</button>
      `;

      const result = parseEventBindings(input);
      expect(result.isNone()).toBeTruthy();
    }
  );
});
