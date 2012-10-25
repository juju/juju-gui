'use strict';

describe('application console', function() {
  var Y, app, container, env, conn, testUtils, App, windowNode;

  before(function() {
    Y = YUI(GlobalConfig).use(
        [ 'juju-gui', 'juju-tests-utils', 'node-event-simulate' ], function(Y) {
          windowNode = Y.one(window);
        });
  });

  afterEach(function() {
    container.remove(true);
  });

  beforeEach(function() {
    container = Y.one('#main').appendChild(Y.Node.create('<div/>')).set('id',
        'test-container').append(
        Y.Node.create('<input />').set('id', 'charm-search-field'));
    testUtils = Y.namespace('juju-tests.utils');
    env = {
      get : function() {
      },
      on : function() {
      },
      after : function() {
      }
    };
  });

  it('should listen for alt-S events', function() {
    var app = new Y.juju.App({
      env : env,
      container : container,
      viewContainer : container
    });
    app.render();

    windowNode.simulate('keydown', {
      keyCode : 83,
      altKey : true
    });
    assert.equal(Y.one('#charm-search-field'), Y.one(document.activeElement));
  });

  it('should listen for alt-E events', function() {
    var app, triggered = false;

    function TestApp(config) {
      // Invoke Base constructor, passing through arguments
      TestApp.superclass.constructor.apply(this, arguments);
    }

    Y.extend(TestApp, Y.juju.App, {
      show_environment : function() {
        triggered = true;
      }
    });

    app = new TestApp({
      env : env,
      container : container,
      viewContainer : container
    });

    app.render();
    windowNode.simulate('keydown', {
      keyCode : 69,
      altKey : true
    });
    assert.isTrue(triggered);
  });
});
