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
      utils, viewlets, views, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'viewlet-charm-details',
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

  beforeEach(function() {
    window.flags.serviceInspector = true;
  });

  afterEach(function() {
    if (fakeStore) {
      fakeStore.destroy();
    }

    if (testContainer) {
      testContainer.remove(true);
    }

    window.flags = {};
  });

  it('should ensure the viewlet exists', function() {
    assert.equal(typeof viewlets.charmDetails, 'object');
  });

  it('renders the viewlet with a charm', function(done) {
    var data = utils.loadFixture('data/browsercharm.json', false);
    testContainer = utils.makeContainer();
    testContainer.setHTML('<div class="left-breakout"></div>');

    fakeStore = new Y.juju.Charmworld2({});
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

    views.BrowserCharmView = function(cfg) {
      assert.isTrue(cfg.forInspector);
      assert.equal(typeof cfg.store, 'object');
      assert.equal(cfg.charm.get('id'), charmID);
      return {
        render: function() {
          done();
        }
      };
    };
    var viewletAttrs = {
      db: new Y.juju.models.Database(),
      store: fakeStore
    };

    viewlets.charmDetails.container = testContainer;
    content = viewlets.charmDetails.render(fakeCharm, viewletAttrs);
    testContainer.one('.left-breakout').setHTML(content);
  });

  it('renders the viewlet with a cached charm', function(done) {
    var data = utils.loadFixture('data/browsercharm.json', true);
    testContainer = utils.makeContainer();
    testContainer.setHTML('<div class="left-breakout"></div>');

    fakeStore = new Y.juju.Charmworld2({});
    var cache = new Y.juju.models.BrowserCharmList();
    var charm = new Y.juju.models.BrowserCharm(data.charm);
    charm.set('cached', true);
    cache.add(charm);

    views.BrowserCharmView = function(cfg) {
      assert.isTrue(cfg.forInspector);
      assert.equal(typeof cfg.store, 'object');
      assert.equal(cfg.charm.get('id'), charmID);
      assert.isTrue(cfg.charm.get('cached'));
      return {
        render: function() {
          done();
        }
      };
    };
    var viewletAttrs = {
      db: {
        charms: cache
      },
      store: fakeStore
    };

    viewlets.charmDetails.container = testContainer;
    content = viewlets.charmDetails.render(fakeCharm, viewletAttrs);
    testContainer.one('.left-breakout').setHTML(content);
  });
});
