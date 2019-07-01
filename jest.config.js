module.exports = {
  preset: 'jest-preset-angular',
  rootDir: 'projects/ngx-template-streams',
  roots: ['src', 'schematics'],
  setupFilesAfterEnv: ['<rootDir>/test.ts'],
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.spec.json'
    }
  },
  watchPathIgnorePatterns: ['.js']
};
