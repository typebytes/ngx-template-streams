import * as ts from 'typescript';
import { resolve } from 'path';

const COMPILER_CONFIG: ts.CompilerOptions = {
  noEmitOnError: false,
  allowJs: true,
  outDir: resolve(__dirname, '../__test__'),
  newLine: ts.NewLineKind.LineFeed,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ESNext,
  skipLibCheck: true,
  sourceMap: false,
  importHelpers: true,
  downlevelIteration: true,
  emitDecoratorMetadata: true,
  experimentalDecorators: true
};

export default function compile(
  input: string,
  transformers: Array<ts.TransformerFactory<ts.SourceFile>>,
  options: ts.CompilerOptions = COMPILER_CONFIG
) {
  const compilerHost = ts.createCompilerHost(options);
  const program = ts.createProgram([input], options, compilerHost);

  const inputSourceFile = program.getSourceFile(input);

  let emitResult = program.emit(inputSourceFile, undefined, undefined, undefined, {
    before: transformers
  });

  let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

  return { emitResult, allDiagnostics };
}
