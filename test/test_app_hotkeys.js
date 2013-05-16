'use strict';

describe('application hotkeys', function() {
  var app, container, env, windowNode, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['juju-gui', 'juju-tests-utils', 'node-event-simulate'], function(Y) {
          env = {
            after: function() {},
            get: function() {},
            on: function() {},
            set: function() {}
          };
          windowNode = Y.one(window);
          done();
        });

  });

  beforeEach(function() {
    container = Y.namespace('juju-tests.utils').makeContainer();
    app = new Y.juju.App({
      env: env,
      container: container,
      viewContainer: container
    });
    app.showView(new Y.View());
    app.activateHotkeys();

    Y.one('#main').append(container);
    app.render();
  });

  afterEach(function() {
    container.remove(true);
    app.destroy({remove: true});
  });

  it('should listen for "?" events', function() {
    windowNode.simulate('keydown', {
      keyCode: 191, // "/" key.
      shiftKey: true
    });
    var help = Y.one('#shortcut-help');
    assert.equal(help.getStyle('display'), 'block');
    help.hide();
  });

  it('should listen for Alt-S key events', function() {
    var searchInput = Y.Node.create('<input/>');
    searchInput.set('id', 'charm-search-field');
    container.append(searchInput);
    windowNode.simulate('keydown', {
      keyCode: 83, // "S" key.
      altKey: true
    });
    // Did charm-search-field get the focus?
    assert.equal(searchInput, Y.one(document.activeElement));
  });

  it('should listen for alt-E events', function(done) {
    var altEtriggered = false;
    app.on('navigateTo', function(ev) {
      if (ev && ev.url === '/:gui:/') {
        altEtriggered = true;
      }
      // Avoid URL change performed by additional listeners.
      ev.stopImmediatePropagation();
      assert.isTrue(altEtriggered);
      done();
    });
    windowNode.simulate('keydown', {
      keyCode: 69, // "E" key.
      altKey: true
    });
  });

});

