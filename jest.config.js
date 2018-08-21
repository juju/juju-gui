'use strict';

const config = {
  roots: ['<rootDir>/jujugui/static/gui/src/app/components'],
  setupFiles: [
    '<rootDir>/jujugui/static/gui/src/test/jest-setup.js',
    '<rootDir>/jujugui/static/gui/src/test/chai-setup.js',
    '<rootDir>/jujugui/static/gui/src/test/enzyme-setup.js',
    '<rootDir>/jujugui/static/gui/src/test/globalconfig.js'
  ],
  testMatch: [
    '**/test-*.js'
  ]
};

module.exports = config;
