import { none, some } from 'fp-ts/lib/Option';

const REGEX = /\(\s*\*(?<event>[^*\"]+)\)\s*\=\s*[\\]?\"[\(]*(?<stream>[^\(\)\\;]+)[\)]*(?:[;][\s]*\$event\s*=\s*(?<payload>[^"\\]+))?[\\]?\"/g;

export function parseEventBindings(template: string) {
  const eventBindings: Array<RegExpExecArray> = [];

  let match = null;

  do {
    match = REGEX.exec(template);

    if (match) {
      eventBindings.push(match);
    }
  } while (match);

  return eventBindings.length ? some(eventBindings) : none;
}
