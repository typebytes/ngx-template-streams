import { some } from 'fp-ts/lib/Option';
import { escapeQuotes, escapeEventPayload } from '../utils/template-helpers';
import { INTERNAL_PREFIX } from './constants';
import { parseEventBindings } from './event-binding-parser';

type TemplateOperation = (template: string) => string;

export function updateEventBindings(template: string, isInlineTemplate = false) {
  return parseEventBindings(template)
    .chain(transformEventBindings(template, isInlineTemplate))
    .getOrElse(template);
}

function transformEventBindings(template: string, isInlineTemplate: boolean) {
  return (eventBindings: Array<RegExpExecArray>) => {
    return getTemplateOperations(eventBindings, isInlineTemplate).map(executeOperations(template));
  };
}

function getTemplateOperations(eventBindings: Array<RegExpExecArray>, isInlineTemplate: boolean) {
  const operations = eventBindings.map(([fullMatch, event, streamName, eventPayload]) => {
    const eventBinding = createEventBinding(event, streamName, eventPayload, isInlineTemplate);
    return createEventBindingOperation(fullMatch, eventBinding);
  });

  return some(operations);
}

function executeOperations(template: string) {
  return (operations: Array<TemplateOperation>) => {
    return operations.reduce<string>((acc: string, operation: TemplateOperation) => {
      return operation(acc);
    }, template);
  };
}

function createEventBinding(event: string, streamName: string, eventPayload = '$event', isInlineTemplate: boolean) {
  const eventBinding = `(${event})="${INTERNAL_PREFIX}${streamName}.next(${escapeEventPayload(eventPayload)})"`;
  return isInlineTemplate ? eventBinding : escapeQuotes(eventBinding);
}

function createEventBindingOperation(fullMatch: string, replacement: string): TemplateOperation {
  return (s: string) => {
    return s.replace(fullMatch, replacement);
  };
}
