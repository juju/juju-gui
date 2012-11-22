'use strict';

describe('application hotkeys', function() {
  var Y, app, container, windowNode;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['juju-gui', 'juju-tests-utils',
          'node-event-simulate'], function(Y) {
          var env = {
            after: function() {},
            get: function() {},
            on: function() {}
          };
          windowNode = Y.one(window);
          app = new Y.juju.App({
            env: env,
            container: container,
            viewContainer: container
          });
          app.activateHotkeys();
          done();
        });
  });

  beforeEach(function() {
    container = Y.Node.create('<div/>');
    Y.one('#main').append(container);
    app.render();
  });

  afterEach(function() {
    container.remove(true);
  });

  it('should listen for alt-S events', function() {
    var searchInput = Y.Node.create('<input/>');
    searchInput.set('id', 'charm-search-field');
    container.append(searchInput);
    windowNode.simulate('keydown', {
      keyCode: 83, //  "S" key.
      altKey: true
    });
    // Did charm-search-field get the focus?
    assert.equal(searchInput, Y.one(document.activeElement));
  });

  it('should listen for alt-E events', function() {
    var altEtriggered = false;
    app.on('navigateTo', function(ev) {
      if (ev && ev.url === '/') {
        altEtriggered = true;
      }
      // Avoid URL change performed by additional listeners.
      ev.stopImmediatePropagation();
    });
    windowNode.simulate('keydown', {
      keyCode: 69, //  "E" key.
      altKey: true
    });
    assert.isTrue(altEtriggered);
  });
});
