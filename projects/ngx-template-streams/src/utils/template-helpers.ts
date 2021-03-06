export function escapeQuotes(input: string) {
  // double escape quotes so that they are not unescaped completely in the template string
  return input.replace(/"/g, '\\"');
}

export function escapeEventPayload(payload: string) {
  // double escape dollar signs ($) because they also represent an escape character
  return payload.replace(/\$/g, '$$$$');
}
