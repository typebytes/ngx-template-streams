import { UnitTestTree, SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { concatMap } from 'rxjs/operators';

export const defaultWorkspaceOptions = {
  name: 'workspace',
  newProjectRoot: 'projects',
  version: '8.0.0'
};

export const defaultAppOptions = {
  name: 'test-app',
  inlineStyle: false,
  inlineTemplate: false,
  viewEncapsulation: 'Emulated',
  routing: false,
  style: 'css',
  skipTests: false
};

export function createWorkspace(
  schematicRunner: SchematicTestRunner,
  workspaceOptions = defaultWorkspaceOptions,
  appOptions = defaultAppOptions
) {
  return schematicRunner
    .runExternalSchematicAsync('@schematics/angular', 'workspace', workspaceOptions)
    .pipe(
      concatMap(tree =>
        schematicRunner.runExternalSchematicAsync('@schematics/angular', 'application', appOptions, tree)
      )
    )
    .toPromise();
}
