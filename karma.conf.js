// Karma configuration
// Generated on Tue Sep 01 2015 11:00:43 GMT-0600 (CST)
'use strict';
module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'chai-sinon'],

    // list of files / patterns to load in the browser
    files: [
      'jujugui/static/gui/build/app/assets/javascripts/jujulib/*.js',

      'jujugui/static/gui/build/app/assets/javascripts/bind-function-pollyfill.js',
      'jujugui/static/gui/build/app/assets/javascripts/react-with-addons.js',
      'jujugui/static/gui/build/app/assets/javascripts/classnames.js',
      'jujugui/static/gui/build/app/utils/component-test-utils.js',

      'jujugui/static/gui/build/app/assets/javascripts/yui/yui/yui.js',
      'jujugui/static/gui/build/app/assets/javascripts/yui/loader/loader.js',

      'jujugui/static/gui/build/app/assets/javascripts/handlebars.runtime.js',

      'jujugui/static/gui/build/app/components/**/*.js',
      'jujugui/static/gui/build/**/test-*.js'
    ],


    // list of files to exclude
    exclude: [
      'jujugui/static/gui/build/app/components/**/*-min.js',
      'jujugui/static/gui/build/**/test-*-min.js',
      'jujugui/static/gui/build/app/assets/javascripts/yui/node_modules/**/*',
      'jujugui/static/gui/build/app/assets/javascripts/yui/yui/node_modules/**/*'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],

    // web server and port
    hostname: '0.0.0.0',
    port: 6543,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};
