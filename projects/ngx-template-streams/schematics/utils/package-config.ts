import { Tree } from '@angular-devkit/schematics';
import { SchematicsException } from '@angular-devkit/schematics';

type DependencyType = 'dependencies' | 'devDependencies' | 'peerDependencies';

export function addPackageToPackageJson(
  host: Tree,
  pkg: string,
  version: string,
  depType: DependencyType = 'dependencies'
): Tree {
  if (host.exists('package.json')) {
    const packageJson = host.read('package.json');

    if (!packageJson) {
      throw new SchematicsException('Could not find package.json');
    }

    const json = JSON.parse(packageJson.toString());

    if (!json[depType]) {
      json[depType] = {};
    }

    let deps = json[depType];

    if (!deps[pkg]) {
      deps[pkg] = version;
      deps = sortObjectByKeys(deps);
    }

    host.overwrite('package.json', JSON.stringify(json, null, 2));
  }

  return host;
}

function sortObjectByKeys(obj: any) {
  return Object.keys(obj)
    .sort()
    .reduce<any>((result, key) => (result[key] = obj[key]) && result, {});
}
