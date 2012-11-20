'use strict';

YUI(GlobalConfig).use([ 'juju-gui', 'juju-tests-utils', 'node-event-simulate'],
    function(Y) {
  describe('application hotkeys', function() {
    var app, container, env, conn, testUtils, windowNode;

    before(function() {
      windowNode = Y.one(window);
      app = new Y.juju.App({
        env: env,
        container: container,
        viewContainer: container
      });
      app.activateHotkeys();
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
      var altEtriggered = false;
      app.on('navigateTo', function(param) {
        if (param && param.url === '/') {
          altEtriggered = true;
        }
      });
      app.render();
      windowNode.simulate('keydown', {
        keyCode: 69, // "E" key
        altKey: true
      });
      assert.isTrue(altEtriggered);
    });
  });
});