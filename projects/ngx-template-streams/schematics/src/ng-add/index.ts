import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';
import { addPackageToPackageJson } from '../../utils/package-config';
import { AddSchema } from './schema';
import { ngxBuildPlusVersion } from './version-names';

export default function(options: AddSchema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    addPackageToPackageJson(tree, 'ngx-build-plus', ngxBuildPlusVersion, 'devDependencies');

    const installTaskId = context.addTask(new NodePackageInstallTask());

    context.addTask(new RunSchematicTask('ng-add-setup', options), [installTaskId]);
  };
}
