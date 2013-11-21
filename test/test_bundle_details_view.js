/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

describe('Browser bundle detail view', function() {
  var Y, cleanUp, utils, data, container, view, fakestore, browser, models;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'view',
        'juju-bundle-models',
        'juju-env-fakebackend',
        'juju-view-bundle',
        'subapp-browser', // required for handlebars helpers
        'subapp-browser-entitybaseview',
        'browser-overlay-indicator',
        'event-tracker',
        'subapp-browser-bundleview',
        'juju-view-utils',
        'juju-tests-utils',
        'event-simulate',
        'node-event-simulate',
        function(Y) {
          models = Y.namespace('juju.models');
          utils = Y.namespace('juju-tests.utils');
          data = utils.loadFixture('data/browserbundle.json', true);

          // Required to register the handlebars helpers
          browser = new Y.juju.subapps.Browser({
            store: utils.makeFakeStore()
          });

          done();
        });
  });

  beforeEach(function() {
    view = generateBundleView();
    view._setupLocalFakebackend = function() {
      this.fakebackend = utils.makeFakeBackend();
    };
    cleanUp = utils.stubCharmIconPath();
  });

  afterEach(function() {
    container.remove().destroy(true);
    view.destroy();
    cleanUp();
  });

  function generateBundleView(options) {
    container = utils.makeContainer();
    container.append('<div class="bws-view-data"></div>');
    var defaults = {
      store: utils.makeFakeStore(),
      db: {},
      entityId: data.id,
      renderTo: container
    };
    var bundleView = Y.mix(defaults, options, true);
    view = new Y.juju.browser.views.BrowserBundleView(bundleView);
    return view;
  }

  it('can be instantiated', function() {
    assert.equal(view instanceof Y.juju.browser.views.BrowserBundleView, true);
  });

  it('displays the bundle data in a tabview', function() {
    view.set('entity', new models.Bundle(data));
    view.render();
    assert.isNotNull(container.one('.yui3-tabview'));

    assert.notEqual(container.get('innerHTML').indexOf('Deployed 5'), -1,
        'Download count is not added to the page.');
  });

  it('fetches the readme when requested', function(done) {
    var fakeStore = utils.makeFakeStore();
    fakeStore.file = function(id, filename, entityType, callbacks) {
      assert.equal(entityType, 'bundle');
      assert.equal(id, data.id);
      assert.equal(filename, 'README');
      assert.isFunction(callbacks.success);
      assert.isFunction(callbacks.failure);
      callbacks.success.call(view, '<div id="testit"></div>');
      assert.isNotNull(container.one('#testit'));
      done();
    };
    view.set('store', fakeStore);
    view.set('entity', new models.Bundle(data));
    view.render();
    container.one('a.readme').simulate('click');
  });

  it('fetches a source file when requested', function(done) {
    var fakeStore = utils.makeFakeStore();
    fakeStore.file = function(id, filename, entityType, callbacks) {
      assert.equal(entityType, 'bundle');
      assert.equal(id, data.id);
      assert.equal(filename, 'bundles.yaml');
      assert.isFunction(callbacks.success);
      assert.isFunction(callbacks.failure);
      callbacks.success.call(view, '<div id="testit"></div>');
      assert.isNotNull(container.one('#testit'));
      done();
    };
    view.set('store', fakeStore);
    view.set('entity', new models.Bundle(data));
    view.render();
    container.one('a.code').simulate('click');
    var codeNode = container.one('#bws-code');
    codeNode.all('select option').item(2).set('selected', 'selected');
    codeNode.one('select').simulate('change');
  });

  it('renders the proper charm icons into the header', function() {
    view.set('entity', new models.Bundle(data));
    view.render();
    assert.equal(
        container.one('.header .details .charms').all('img').size(), 4);
  });

  it('shows a confirmation when trying to deploy a bundle', function() {
    view.set('entity', new models.Bundle(data));
    view.render();
    var button = container.one('.bundle .add.deploy');
    button.simulate('click');
    assert.isFalse(button.hasClass('deploy'),
        'add button should not have deploy class');
    assert.isTrue(button.hasClass('confirm'),
        'add button is missing confirm class');
    assert.equal(button.getHTML(), 'Yes, I\'m sure');
    assert.isFalse(
        container.one('.notifier-box.bundle').hasClass('hidden'),
        'notification should not have hidden class');
  });

  it('deploys a bundle when \'add\' and confirmation button is clicked',
      function(done) {
        // app.js sets this to its deploy bundle method so
        // as long as it's called it's successful.
        view.set('deployBundle', function(data) {
          assert.isObject(data);
          done();
        });
        view.set('entity', new models.Bundle(data));
        view.render();
        container.one('.bundle .add.deploy').simulate('click');
        container.one('.bundle .add.confirm').simulate('click');
      });

  it('generates positions if services don\'t provide xy annotations',
     function(done) {
       Y.Object.values(data.data.services).forEach(function(service) {
         service.annotations = {};
       });
       view.set('entity', new models.Bundle(data));
       view.on('topologyRendered', function(e) {
         assert.isNotNull(container.one('.topology-canvas'));
         // Check that the bundle topology tab is the landing tab.
         assert.equal(view.tabview.get('selection').get('index'), 0);
         var vis = d3.select(container.one('svg').getDOMNode());

         // Check that an error is shown.
         assert.equal(vis.select('text').text(),
         '(Bundle did not provide position information; ' +
             'services positioned automatically.)');

         // Check that services are positioned.
         vis.selectAll('.service').each(function(service) {
           assert.notEqual(service.x, 0);
           assert.isNumber(service.x);
           assert.notEqual(service.y, 0);
           assert.isNumber(service.y);
           var annotations = service.model.get('annotations');
           assert.notEqual(annotations['gui-x'], 0);
           assert.isNumber(annotations['gui-x']);
           assert.notEqual(annotations['gui-y'], 0);
           assert.isNumber(annotations['gui-y']);
         });

         done();
       });
       view.render();
     });

  it('renders the bundle topology into the view', function(done) {
    view._parseData = function() {
      return new Y.Promise(function(resolve) { resolve(); });
    };
    var entity = {
      charm_metadata: {
        foo: {
          id: 'precise/foo-9',
          storeId: 'testid',
          name: 'foo'
        },
        bar: {
          id: 'precise/bar-10',
          storeId: 'testid',
          name: 'bar'
        }
      },
      files: [],
      data: {
        services: {
          foo: {
            annotations: {
              'gui-x': '1',
              'gui-y': '2'
            }
          },
          bar: {
            annotations: {
              'gui-x': '3',
              'gui-y': '4'
            }
          }
        }
      }
    };
    view.on('topologyRendered', function(e) {
      assert.isNotNull(container.one('.topology-canvas'));
      // Check that the bundle topology tab is the landing tab.
      assert.equal(view.tabview.get('selection').get('index'), 0);
      done();
    });
    view.set('entity', new models.Bundle(entity));
    view.render();
  });

  it('disabled relation line and label click interactions', function(done) {

    Y.juju.views.createModalPanel = function(rel, self) {
      // If we hit this method then the relationInteractive flag was not
      // respected and we are showing a modal panel to remove the relation.
      assert.fail();
    };

    view.on('topologyRendered', function(e) {
      var relLabel = container.one('.rel-label');
      assert.isNotNull(relLabel);
      relLabel.simulate('click');
      assert.isNotNull(container.one('.topology-canvas'));
      // Check that the bundle topology tab is the landing tab.
      assert.equal(view.tabview.get('selection').get('index'), 0);
      done();
    });

    view.set('entity', new models.Bundle(data));
    view.render();
  });

  it('renders the charm list tab properly', function() {
    // This is not under test. It's async and only causes trouble in other
    // tests.
    view._parseData = function() {
      return new Y.Promise(function(resolve) { resolve(); });
    };

    var entity = {
      charm_metadata: {
        foo: {
          id: 'precise/foo-9',
          storeId: 'testid',
          name: 'foo'
        },
        bar: {
          id: 'precise/bar-10',
          storeId: 'testid',
          name: 'bar'
        }
      },
      files: [],
      data: {
        services: {
          foo: {
            annotations: {
              'gui-x': '1',
              'gui-y': '2'
            }
          },
          bar: {
            annotations: {
              'gui-x': '3',
              'gui-y': '4'
            }
          }
        }
      },
      services: {
        foo: {
          annotations: {
            'gui-x': '1',
            'gui-y': '2'
          }
        },
        bar: {
          annotations: {
            'gui-x': '3',
            'gui-y': '4'
          }
        }
      }
    };
    view.set('entity', new models.Bundle(entity));
    view.render();
    var tab = container.one('#bws-services');
    assert.equal(tab.all('.token').size(), 2);
    var charmConfigNodes = tab.all('.charm-config');
    assert.equal(
        charmConfigNodes.item(0).one('li').get('text'), 'Service name: bar');
    assert.equal(
        charmConfigNodes.item(1).one('li').get('text'), 'Service name: foo');
  });

  it('selects the proper tab when given one', function() {
    view.set('activeTab', '#bws-services');
    view._parseData = function() {
      return new Y.Promise(function(resolve) { resolve(); });
    };
    view.set('entity', new models.Bundle(data));
    view.render();
    var selected = view.get('container').one('.yui3-tab-selected a');
    assert.equal(selected.getAttribute('href'), '#bws-services');
  });

});
