/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2013 Canonical Ltd.

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

describe('Service Inspector', function() {
  var charmData, conn, container, db, env, ecs, models, service, utils, view, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'environment-change-set',
      'juju-tests-utils',
      'juju-views',
      'node-event-simulate',
      'service-inspector'
    ], function(Y) {
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      charmData = utils.loadFixture(
          'data/mediawiki-api-response.json', true);
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'container');
    db = new models.Database();
    conn = new utils.SocketStub();
    db = new models.Database();
    ecs = new Y.juju.EnvironmentChangeSet();
    env = Y.juju.newEnvironment({conn: conn, ecs: ecs});
    env.connect();
  });

  afterEach(function(done) {
    db.destroy();
    env.after('destroy', function() { done(); });
    env.destroy();
  });

  var setUpInspector = function(service) {
    var charm = new models.Charm(charmData.charm);
    db.charms.add(charm);

    if (!service) {
      service = db.services.add({
        id: charm.get('package_name'),
        charm: charm.get('id')
      });
    }

    var fakeStore = new Y.juju.charmworld.APIv3({});
    fakeStore.iconpath = function(id) {
      return '/icon/' + id;
    };

    view = new Y.juju.views.environment({
      container: container,
      db: db,
      env: env,
      store: fakeStore
    });

    view.render();

    container.append(
        '<div id="bws-sidebar"><div class="bws-content"></div></div>');

    var inspector = new Y.juju.views.ServiceInspector({
      db: db,
      model: service,
      env: env,
      environment: view,
      charmModel: charm,
      topo: view.topo,
      store: fakeStore
    });
    return inspector;
  };

  it('can render charm details', function() {
    var inspector = setUpInspector();
    var stubShow = utils.makeStubMethod(inspector, 'showViewlet');
    this._cleanups.push(stubShow.reset);
    inspector.render();
    assert.equal(stubShow.lastArguments()[0], 'overview');

    inspector.set('showCharm', true);
    inspector.render();
    assert.equal(stubShow.lastArguments()[0], 'charmDetails');
  });

  it('can re-render charm details', function() {
    var inspector = setUpInspector();
    var stubShow = utils.makeStubMethod(inspector, 'showViewlet');
    this._cleanups.push(stubShow.reset);
    var stubDetailsRender = utils.makeStubMethod(
        inspector.views.charmDetails, 'render');
    this._cleanups.push(stubDetailsRender.reset);
    inspector.set('showCharm', true);
    // The first call to render uses showViewlet
    inspector.render();
    // Call count is 3 because 'overview' and 'inspectorHeader' are also
    // displayed.
    assert.equal(stubShow.callCount(), 3);
    assert.equal(stubDetailsRender.callCount(), 0);
    assert.equal(stubShow.lastArguments()[0], 'charmDetails');

    inspector.views.charmDetails.set('rendered', true);
    inspector.render();
    assert.equal(stubShow.callCount(), 3);
    assert.equal(stubDetailsRender.callCount(), 1);
  });

  it('handles rendering details when they\'re "destroyed"', function() {
    var inspector = setUpInspector();
    var stubShow = utils.makeStubMethod(inspector, 'showViewlet');
    this._cleanups.push(stubShow.reset);
    inspector.set('showCharm', true);
    // The first call to render uses showViewlet
    inspector.render();
    // Call count is 3 because 'overview' and 'inspectorHeader' are also
    // displayed.
    assert.equal(stubShow.callCount(), 3);
    assert.equal(stubShow.lastArguments()[0], 'charmDetails');

    inspector.views.charmDetails.destroy();
    inspector.render();
    assert.equal(stubShow.callCount(), 4);
    assert.equal(stubShow.lastArguments()[0], 'charmDetails');
  });

  it('handles re-rendering the overview', function() {
    var inspector = setUpInspector();
    var stubShow = utils.makeStubMethod(inspector, 'showViewlet');
    this._cleanups.push(stubShow.reset);
    var stubOverviewRender = utils.makeStubMethod(
        inspector.views.overview, 'render');
    this._cleanups.push(stubOverviewRender.reset);
    var stubHeaderRender = utils.makeStubMethod(
        inspector.views.inspectorHeader, 'render');
    this._cleanups.push(stubHeaderRender.reset);

    inspector.renderUI();
    // Two calls two showViewlet, one for inspectorHeader, one for overview.
    assert.equal(stubShow.callCount(), 2);
    assert.equal(stubOverviewRender.callCount(), 0);
    assert.equal(stubHeaderRender.callCount(), 0);

    inspector.renderUI();
    assert.equal(stubShow.callCount(), 2);
    assert.equal(stubOverviewRender.callCount(), 1);
    assert.equal(stubHeaderRender.callCount(), 1);
  });

  it('can render unit details', function() {
    var inspector = setUpInspector();
    var stubShow = utils.makeStubMethod(inspector, 'showViewlet');
    inspector.render();
    assert.equal(stubShow.lastArguments()[0], 'overview');
    inspector.set('activeUnit', 0);
    inspector.render();
    assert.equal(stubShow.lastArguments()[0], 'unitDetails');
  });

  it('fires the changeState event when the charm uri is clicked', function() {
    var inspector = setUpInspector();
    inspector.render();
    var fireStub = utils.makeStubMethod(inspector, 'fire');
    this._cleanups.push(fireStub.reset);
    inspector.get('container').one('.charm-url').simulate('click');
    assert.equal(fireStub.calledOnce(), true);
    var fireArgs = fireStub.lastArguments();
    assert.equal(fireArgs[0], 'changeState');
    assert.deepEqual(
        fireArgs[1],
        { sectionA: { metadata: { unit: null, charm: true }}});
  });

  it('can dismiss notifications', function() {
    // Create a ghost service with a fake charm.
    var charm = new models.Charm(charmData.charm);
    db.charms.add(charm);
    service = db.services.ghostService(charm);
    var stubDismiss = utils.makeStubMethod(
        Y.juju.viewlets.InspectorHeader.prototype, '_dismissMessage');
    this._cleanups.push(stubDismiss.reset);
    var inspector = setUpInspector(service);
    inspector.render();
    inspector.get('container').one('span[dismiss]').simulate('click');
    assert.equal(stubDismiss.callCount(), 1);
  });
});
