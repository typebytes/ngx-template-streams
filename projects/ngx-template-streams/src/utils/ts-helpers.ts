import * as ts from 'typescript';

export function printFileContent(sourceFile: ts.SourceFile, newLine = ts.NewLineKind.LineFeed): string {
  const printer = ts.createPrinter({
    newLine
  });

  return printer.printFile(sourceFile);
}
