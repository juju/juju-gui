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

describe('Inspector Charm', function() {
  var charmID, container, content, fakeCharm, fakeStore, testContainer,
      utils, viewlets, view, views, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'charm-details-view',
      'juju-charm-store',
      'juju-tests-utils',
      'subapp-browser-views'
    ], function(Y) {
      utils = Y.namespace('juju-tests.utils');
      viewlets = Y.namespace('juju.viewlets');
      views = Y.namespace('juju.browser.views');

      charmID = 'cs:precise/apache2-10';
      fakeCharm = {
        get: function() {
          return charmID;
        }
      };
      done();
    });
  });

  afterEach(function(done) {
    if (fakeStore) {
      fakeStore.destroy();
    }
    view.after('destroy', function() {
      done();
    });
    view.destroy();
  });

  it('can be instantiated', function() {
    view = new viewlets.charmDetails();
    assert.equal(view instanceof viewlets.charmDetails, true);
  });

  it('renders the view with a charm', function() {
    var data = utils.loadFixture('data/browsercharm.json', false);
    testContainer = utils.makeContainer(this);
    testContainer.setHTML([
      '<div class="charmbrowser">',
      '<div class="left-breakout">',
      '</div>',
      '</div>'
    ].join(''));

    fakeStore = new Y.juju.charmworld.APIv3({});
    fakeStore.set('datasource', {
      sendRequest: function(params) {
        // Stubbing the server callback value
        params.callback.success({
          response: {
            results: [{
              responseText: data
            }]
          }
        });
      }
    });

    var viewletAttrs = {
      db: new Y.juju.models.Database(),
      store: fakeStore
    };

    var tabviewRender = utils.makeStubFunction();
    var browserCharmView = utils.makeStubMethod(
        views, 'BrowserCharmView', {
          render: tabviewRender,
          destroy: function() {}
        });
    this._cleanups.push(browserCharmView.reset);

    view = new viewlets.charmDetails();
    view.container = testContainer;
    view.render(fakeCharm, viewletAttrs);

    assert.equal(browserCharmView.calledOnce(), true);
    var bcvArgs = browserCharmView.lastArguments();
    assert.equal(bcvArgs[0].forInspector, true);
    assert.equal(typeof bcvArgs[0].store, 'object');
    assert.equal(bcvArgs[0].entity.get('id'), charmID);

    assert.equal(tabviewRender.calledOnce(), true);
  });

  it('renders the viewlet with a cached charm', function(done) {
    var data = utils.loadFixture('data/browsercharm.json', true);
    testContainer = utils.makeContainer(this);
    testContainer.setHTML([
      '<div class="charmbrowser">',
      '<div class="left-breakout">',
      '</div>',
      '</div>'
    ].join(''));

    fakeStore = new Y.juju.charmworld.APIv3({});
    var cache = new Y.juju.models.CharmList();
    var charm = new Y.juju.models.Charm(data.charm);
    charm.set('cached', true);
    cache.add(charm);

    views.BrowserCharmView = function(cfg) {
      assert.isTrue(cfg.forInspector);
      assert.equal(typeof cfg.store, 'object');
      assert.equal(cfg.entity.get('id'), charmID);
      assert.isTrue(cfg.entity.get('cached'));
      return {
        render: function() { done(); },
        destroy: function() {}
      };
    };
    var viewletAttrs = {
      db: {
        charms: cache
      },
      store: fakeStore
    };

    view = new viewlets.charmDetails();
    view.container = testContainer;
    view.render(fakeCharm, viewletAttrs);
  });
});
