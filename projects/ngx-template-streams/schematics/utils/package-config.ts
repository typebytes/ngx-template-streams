import { Tree } from '@angular-devkit/schematics';

type DependencyType = 'dependencies' | 'devDependencies' | 'peerDependencies';

export function addPackageToPackageJson(
  host: Tree,
  pkg: string,
  version: string,
  depType: DependencyType = 'dependencies'
): Tree {
  if (host.exists('package.json')) {
    const sourceText = host.read('package.json')!.toString('utf-8');
    const json = JSON.parse(sourceText);

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
