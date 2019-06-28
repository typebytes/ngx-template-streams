export function createModule(moduleExport: string) {
  return (template: string) => moduleExport + `"${template}"`;
}
