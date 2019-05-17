'use strict';

const config = {
  moduleNameMapper: {
    '.scss$': '<rootDir>/gui/src/test/proxy-module.js'
  },
  roots: ['<rootDir>/gui/src/app'],
  setupFiles: [
    '<rootDir>/gui/src/test/jest-setup.js',
    '<rootDir>/gui/src/test/chai-setup.js',
    '<rootDir>/gui/src/test/enzyme-setup.js',
    '<rootDir>/gui/src/test/globalconfig.js'
  ],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  testMatch: [
    '**/components/**/test-*.js',
    '**/init/test-analytics.js',
    '**/init/test-app.js',
    '**/init/test-cookie-util.js',
    '**/maraca/test-*.js'
  ]
};

module.exports = config;
