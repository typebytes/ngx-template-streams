const STRING_CAMELIZE_REGEXP = /(-|_|\.|\s)+(.)?/g;

export function camelize(str: string): string {
  return str
    .replace(STRING_CAMELIZE_REGEXP, (_match: string, _separator: string, chr: string) => {
      return chr ? chr.toUpperCase() : '';
    })
    .replace(/^([A-Z])/, (match: string) => match.toLowerCase());
}
