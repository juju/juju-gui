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
    '**/mega-watcher/test-mega-watcher.js'
  ]
};

module.exports = config;
