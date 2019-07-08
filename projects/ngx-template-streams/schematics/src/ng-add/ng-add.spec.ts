import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { WorkspaceSchema } from '@schematics/angular/utility/workspace-models';
import { join } from 'path';
import { createWorkspace } from '../../testing/create-workspace';
import { AddSchema } from './schema';
import { ngxBuildPlusVersion } from './version-names';

const collectionPath = join(__dirname, '../../collection.json');

describe('Add Schematic', () => {
  let schematicRunner: SchematicTestRunner;
  let appTree: UnitTestTree;

  const defaultOptions: AddSchema = {};

  beforeEach(async () => {
    schematicRunner = new SchematicTestRunner('ngx-template-streams-schematics', collectionPath);
    appTree = await createWorkspace(schematicRunner);
  });

  it('should update package.json', async () => {
    const tree = await schematicRunner.runSchematicAsync('ng-add', defaultOptions, appTree).toPromise();

    const packageJson = JSON.parse(tree.readContent('/package.json'));
    const devDependencies = packageJson.devDependencies;
    const ngxBuildPlusDependency = devDependencies['ngx-build-plus'];

    expect(ngxBuildPlusDependency).toBe(ngxBuildPlusVersion);
  });

  it('should schedule install and setup task', async () => {
    await schematicRunner.runSchematicAsync('ng-add', defaultOptions, appTree).toPromise();

    const tasks = schematicRunner.tasks;

    expect(tasks.length).toBe(2);
    expect(tasks.some(task => task.name === 'node-package')).toBe(true);
    expect(tasks.some(task => task.name === 'run-schematic')).toBe(true);
  });

  it('should update builders', async () => {
    const tree = await schematicRunner.runSchematicAsync('ng-add-setup', defaultOptions, appTree).toPromise();

    const workspace: WorkspaceSchema = JSON.parse(tree.readContent('/angular.json'));
    const project = workspace.defaultProject;
    const architect = workspace.projects[project].architect;

    const expected = {
      extraWebpackConfig: 'node_modules/@typebytes/ngx-template-streams/webpack/webpack.config.js',
      plugin: '~node_modules/@typebytes/ngx-template-streams/internal/plugin.js'
    };

    expect(architect.build.options).toMatchObject(expected);
    expect(architect.serve.options).toMatchObject(expected);
    expect(architect.test.options).toMatchObject(expected);
  });
});
