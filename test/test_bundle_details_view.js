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

  var browser, charmstore, cleanUp, container, data, factory, fakestore, models,
      utils, view, Y;

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
        'juju-tests-factory',
        'event-simulate',
        'node-event-simulate',
        'charmstore-api',
        function(Y) {
          models = Y.namespace('juju.models');
          utils = Y.namespace('juju-tests.utils');
          factory = Y.namespace('juju-tests.factory');
          // Required to register the handlebars helpers
          browser = new Y.juju.subapps.Browser({
            charmstore: factory.makeFakeCharmstore()
          });

          done();
        });
  });

  beforeEach(function() {
    charmstore = new Y.juju.charmstore.APIv4({
      charmstoreURL: 'local/'
    });
    data = charmstore._processEntityQueryData(
        utils.loadFixture('data/apiv4-bundle.json', true));
    view = generateBundleView(this);
    view._setupLocalFakebackend = function() {
      this.fakebackend = factory.makeFakeBackend();
    };
    window.flags = {};
    cleanUp = utils.stubCharmIconPath();
  });

  afterEach(function() {
    window.flags = {};
    view.destroy();
    cleanUp();
  });

  after(function() {
    browser.destroy();
  });

  function generateBundleView(context, options) {
    container = utils.makeContainer(context);
    container.append('<div class="bws-view-data"></div>');
    var defaults = {
      db: {},
      entityId: data.id,
      renderTo: container,
      charmstore: charmstore
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
    assert.isNotNull(container.one('.yui3-juju-browser-tabview'));

    assert.notEqual(container.get('innerHTML').indexOf('Deployed 0'), -1,
        'Download count is not added to the page.');

    // Verify that the num_units is represented correctly.
    assert(
        container.one('.charm-config').get('innerHTML').match(/units:\s+1/),
        'Expected to find the number of units to be 5, but not found.');
  });

  it('fetches the readme when requested', function() {
    var getFile = utils.makeStubMethod(view.get('charmstore'), 'getFile');
    this._cleanups.push(getFile.reset);
    view.set('entity', new models.Bundle(data));
    view.render();
    // Bypass any routing that might take place for testing sanity.
    view.tabview.set('skipAnchorNavigation', true);
    container.one('a.readme').simulate('click');
    assert.equal(getFile.callCount(), 1);
    var getArgs = getFile.lastArguments();
    assert.equal(getArgs[0], data.id);
    assert.equal(getArgs[1], 'README.md');
    assert.equal(typeof getArgs[2] === 'function', true);
    assert.equal(typeof getArgs[3] === 'function', true);
  });

  it('fetches a source file when requested', function() {
    var getFile = utils.makeStubMethod(view.get('charmstore'), 'getFile');
    this._cleanups.push(getFile.reset);

    view.set('entity', new models.Bundle(data));
    view.render();
    // Bypass any routing that might take place for testing sanity.
    view.tabview.set('skipAnchorNavigation', true);
    container.one('a.code').simulate('click');
    var codeNode = container.one('#code');
    codeNode.all('select option').item(2).set('selected', 'selected');
    codeNode.one('select').simulate('change');

    view.set('entity', new models.Bundle(data));
    view.render();

    assert.equal(getFile.callCount(), 1);
    var getArgs = getFile.lastArguments();
    assert.equal(getArgs[0], data.id);
    assert.equal(getArgs[1], 'bundle.yaml');
    assert.equal(typeof getArgs[2] === 'function', true);
    assert.equal(typeof getArgs[3] === 'function', true);
  });

  it('renders the proper charm icons into the header', function() {
    view.set('entity', new models.Bundle(data));
    view.render();
    assert.equal(
        container.one('.header .details .charms').all('img').size(), 5);
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
        var changeStateFired = false;
        var handler = view.on('changeState', function(state) {
          changeStateFired = true;
          assert.deepEqual(state.details[0], {
            sectionA: {
              component: 'charmbrowser',
              metadata: { id: null }
            }});
        });
        this._cleanups.push(function() { handler.detach(); });
        // app.js sets this to its deploy bundle method so
        // as long as it's called it's successful.
        view.set('deployBundle', function(data) {
          assert.equal(data, 'bundle: data');
          assert.equal(changeStateFired, true);
          done();
        });
        view.set('charmstore', {
          getBundleYAML: function(id, callback) {
            callback({target: {responseText: 'bundle: data'}});
          },
          downConvertBundleYAML: function() {
            return 'bundle: data';
          }
        });
        view.set('entity', new models.Bundle(data));
        view.render();
        container.one('.bundle .add.deploy').simulate('click');
        container.one('.bundle .add.confirm').simulate('click');
      });

  it('generates positions if services don\'t provide xy annotations',
     function(done) {
       Y.Object.values(data.services).forEach(function(service) {
         service.annotations = {};
       });
       view.set('entity', new models.Bundle(data));
       view.on('topologyRendered', function(e) {
         assert.isNotNull(container.one('.topology-canvas'));
         // Check that the bundle topology tab is the landing tab.
         assert.equal(view.tabview.get('selection').get('hash'), '#bundle');
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
    view.on('topologyRendered', function(e) {
      assert.isNotNull(container.one('.topology-canvas'));
      // Check that the bundle topology tab is the landing tab.
      assert.equal(view.tabview.get('selection').get('hash'), '#bundle');
      done();
    });
    view.set('entity', new models.Bundle(data));
    view.render();
  });

  it('disabled relation line and label click interactions', function(done) {
    Y.juju.views.createModalPanel = function(rel, self) {
      // If we hit this method then the relationInteractive flag was not
      // respected and we are showing a modal panel to remove the relation.
      assert.fail();
    };
    view.after('topologyRendered', function(e) {
      container.one('.rel-indicator').simulate('click');
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
    view.set('entity', new models.Bundle(data));
    view.render();
    var tab = container.one('#services');
    assert.equal(tab.all('.token').size(), 5);
    var charmConfigNodes = tab.all('.charm-config');
    assert.equal(
        charmConfigNodes.item(0).one('li').get('text'),
        'Service name: configsvr');
    assert.equal(
        charmConfigNodes.item(1).one('li').get('text'),
        'Service name: mongos');
    assert.equal(
        charmConfigNodes.item(2).all('li').item(2).get('text'),
        'replicaset: shard1');
    assert.equal(
        charmConfigNodes.item(1).all('li').item(1).get('text').indexOf(1) > 0,
        true);
  });

  it('selects the proper tab when given one', function() {
    view.set('activeTab', '#services');
    view._parseData = function() {
      return new Y.Promise(function(resolve) { resolve(); });
    };
    view.set('entity', new models.Bundle(data));
    view.render();
    var selected = view.get('container').one('nav .active');
    assert.equal(selected.getAttribute('href'), '#services');
  });

  it('sets the proper change request when closed', function(done) {
    view.set('activeTab', '#services');
    view._parseData = function() {
      return new Y.Promise(function(resolve) { resolve(); });
    };
    view.set('entity', new models.Bundle(data));
    view.on('changeState', function(ev) {
      assert.equal(ev.details[0].sectionA.metadata.id, null,
                   'The charm id is not set to null.');
      assert.equal(ev.details[0].sectionA.metadata.hash, null,
                   'The charm details hash is not set to null.');
      done();
    });
    view.render();
    view.get('container').one('.bundle .back').simulate('click');
  });

  it('can generate source and revno links from its charm', function() {
    view.set('entity', new models.Bundle(data));
    var branchUrl = view.get('entity').get('code_source').location;
    var url = view._getSourceLink(branchUrl);
    var expected =
        'http://bazaar.launchpad.net/' +
        '~charmers/charms/bundles/mongodb-cluster/bundle/files';
    assert.equal(url, expected);
    var revnoLink = view._getRevnoLink(url, 1);
    assert.equal(revnoLink, expected + '/1');
  });

  it('can generate a quickstart deploy id', function() {
    view.set('entity', new models.Bundle(data));
    view.render();
    var text = view.get('container').one('#deploy').get('text');
    assert.equal(text.indexOf('juju-quickstart mongodb-cluster/4') > 0, true);
  });

  it('can generate a namespaced quickstart deploy id', function() {
    data.id = 'cs:~jorge/bundle/mongodb-cluster-4';
    view.set('entity', new models.Bundle(data));
    view.render();
    var text = view.get('container').one('#deploy').get('text');
    assert.equal(
        text.indexOf('juju-quickstart u/jorge/mongodb-cluster/4') > 0, true);
  });

  it('can generate a bugs link', function() {
    view.set('entity', new models.Bundle(data));
    var branchUrl = view.get('entity').get('code_source').location;
    var url = view._getBugsLink(branchUrl);
    var expected = 'https://bugs.launchpad.net/charms/+source/mongodb-cluster';
    assert.equal(url, expected);
  });

});
