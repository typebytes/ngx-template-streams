export class ObservableEventError extends Error {
  constructor(decorator: string, event: string, target: string, message?: string) {
    const additionalMessage = message ? ' ' + message : '';
    super(`[${decorator}] Cannot create event stream for '${event}' on target '${target}'.` + additionalMessage);
  }
}
