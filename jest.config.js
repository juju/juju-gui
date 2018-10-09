'use strict';

const config = {
  roots: ['<rootDir>/jujugui/static/gui/src/app'],
  setupFiles: [
    '<rootDir>/jujugui/static/gui/src/test/jest-setup.js',
    '<rootDir>/jujugui/static/gui/src/test/chai-setup.js',
    '<rootDir>/jujugui/static/gui/src/test/enzyme-setup.js',
    '<rootDir>/jujugui/static/gui/src/test/globalconfig.js'
  ],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  testMatch: [
    '**/components/**/test-*.js',
    '**/init/test-app.js',
    '**/init/test-cookie-util.js',
    '**/maraca/test-*.js'
  ]
};

module.exports = config;
