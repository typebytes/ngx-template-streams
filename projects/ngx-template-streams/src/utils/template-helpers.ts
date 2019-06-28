export function escapeQuotes(input: string) {
  // double escape quotes so that they are not unescaped completely in the template string
  return input.replace(/"/g, '\\"');
}
