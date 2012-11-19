'use strict';

describe('application hotkeys', function() {
  var Y, app, container, env, conn, testUtils, windowNode, altEtriggered;

  before(function() {
    Y = YUI(GlobalConfig).use(
        ['juju-gui', 'juju-tests-utils',
          'node-event-simulate'], function(Y) {
          windowNode = Y.one(window);

          function TestApp(config) {
            // Invoke Base constructor, passing through arguments
            TestApp.superclass.constructor.apply(this, arguments);
          }

          // Mocking the "show_environment" function.
          Y.extend(TestApp, Y.juju.App, {
            show_environment: function() {
              altEtriggered = true;
            }
          });

          app = new TestApp({
            env: env,
            container: container,
            viewContainer: container
          });
          app.activateHotkeys();

          altEtriggered = false;
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
      get: function() {
      },
      on: function() {
      },
      after: function() {
      }
    };
  });

  it('should listen for alt-S events', function() {
    app.render();
    windowNode.simulate('keydown', {
      keyCode: 83, // "S" key
      altKey: true
    });
    // Did charm-search-field get the focus?
    assert.equal(Y.one('#charm-search-field'), Y.one(document.activeElement));
  });

  it('should listen for alt-E events', function() {
    assert.isFalse(altEtriggered);
    app.render();
    windowNode.simulate('keydown', {
      keyCode: 69, // "E" key
      altKey: true
    });
    assert.isTrue(altEtriggered);
  });
});
