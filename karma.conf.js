// Karma configuration
// Generated on Tue Sep 01 2015 11:00:43 GMT-0600 (CST)
'use strict';
module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // Set up the log level so that console.log messages are visible.
    browserConsoleLogOptions: {level: 'log'},

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'chai-sinon'],

    // List of files / patterns to load in the browser; Karma is smart enough,
    // with the preprocessors, to watch the source files and serve the compiled
    // files.
    files: [
      'jujugui/static/gui/src/app/jujulib/index.js',
      'jujugui/static/gui/src/app/jujulib/charmstore.js',
      'jujugui/static/gui/src/app/jujulib/plans.js',
      'jujugui/static/gui/src/app/jujulib/payment.js',
      'jujugui/static/gui/src/app/jujulib/stripe.js',
      'jujugui/static/gui/src/app/jujulib/terms.js',
      'jujugui/static/gui/src/app/jujulib/reconnecting-websocket.js',
      'jujugui/static/gui/src/app/jujulib/urls.js',
      'jujugui/static/gui/src/app/jujulib/bakery-factory.js',
      'jujugui/static/gui/src/app/jujulib/bundleservice.js',
      'jujugui/static/gui/src/app/jujulib/test-*.js',

      'jujugui/static/gui/src/app/state/*.js',

      'jujugui/static/gui/build/app/assets/javascripts/bind-function-pollyfill.js',
      'jujugui/static/gui/build/app/assets/javascripts/react-with-addons.js',
      'jujugui/static/gui/build/app/assets/javascripts/react-dom.js',
      'jujugui/static/gui/build/app/assets/javascripts/classnames.js',
      'jujugui/static/gui/build/app/assets/javascripts/marked.js',
      'jujugui/static/gui/build/app/assets/javascripts/clipboard.js',
      'jujugui/static/gui/build/app/assets/javascripts/react-click-outside.js',
      'jujugui/static/gui/build/app/assets/javascripts/ReactDnD.min.js',
      'jujugui/static/gui/build/app/assets/javascripts/ReactDnDHTML5Backend.min.js',
      'jujugui/static/gui/build/app/assets/javascripts/diff.js',
      'jujugui/static/gui/build/app/assets/javascripts/prism.js',
      'jujugui/static/gui/build/app/assets/javascripts/prism-languages.js',
      'jujugui/static/gui/build/app/utils/component-test-utils.js',

      'jujugui/static/gui/build/app/assets/javascripts/yui/yui/yui.js',
      'jujugui/static/gui/build/app/assets/javascripts/yui/loader/loader.js',

      'jujugui/static/gui/src/app/components/**/*.js',

      'jujugui/static/gui/build/app/store/env/acl.js',
      'jujugui/static/gui/build/app/store/env/test-acl.js',

      'jujugui/static/gui/build/app/utils/jujulib-conversion-utils.js',
      'jujugui/static/gui/build/app/utils/net-utils.js',
      'jujugui/static/gui/build/app/utils/test-net-utils.js',
      'jujugui/static/gui/build/app/utils/analytics.js',
      'jujugui/static/gui/build/app/utils/test-analytics.js'
    ],

    // list of files to exclude
    exclude: [
      'jujugui/static/gui/build/app/components/**/*-min.js'
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'jujugui/static/gui/src/app/components/**/*.js': ['babel'],
    },

    // set the options for the various preprocessors used
    babelPreprocessor: {
      filename: function (file) {
        return file.originalPath.replace(/gui\/src\//, 'gui/build/');
      },
      sourceFileName: function (file) {
        return file.originalPath;
      }
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],

    // web server and port
    hostname: '0.0.0.0',
    port: 6544,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
