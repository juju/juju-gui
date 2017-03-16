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

describe('App Renderer Extension', function() {

  var createElementStub,
      juju,
      Renderer,
      renderer,
      renderStub,
      Y;

  before(function(done) {
    var requires = [
      'base',
      'app-renderer-extension'
    ];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
      juju = Y.namespace('juju');
      done();
    });
  });

  beforeEach(function() {
    Renderer = Y.Base.create(
        'apprenderer', Y.Base, [juju.AppRenderer], {}, {
          ATTRS: {
            gisf: {
              value: false
            }
          }
        });
    renderer = new Renderer();
    // React method stubs.
    renderStub = sinon.stub(ReactDOM, 'render');
    this._cleanups.push(renderStub.restore);
    createElementStub = sinon.stub(React, 'createElement');
    this._cleanups.push(createElementStub.restore);
    // Bootstrap various renderer attributes and properties.
    var ecs = {
      getCurrentChangeSet: sinon.stub().returns({})
    };
    var Env = Y.Base.create('env', Y.Base, [], {
    }, {
      ATTRS: {
        ecs: {}
      }
    });
    renderer.env = new Env({ecs: ecs});
    renderer.controllerAPI = {
      findFacadeVersion: sinon.stub(),
      listModelsWithInfo: sinon.stub()
    };

    renderer._getAuth = sinon.stub().returns({user: 'test'});

    renderer.state = {
      changeState: sinon.stub()
    };
    renderer.db = {
      environment: {
        set: sinon.stub(),
        get: sinon.stub().returns('test-model')
      }
    };
    renderer.changeState = sinon.stub();
    renderer.switchEnv = sinon.stub();
    renderer.createSocketURL = sinon.stub();
  });

  afterEach(function() {
    renderer.destroy();
  });

  describe('_renderBreadcrumb', function() {
    let stub;

    beforeEach(function() {
      stub = sinon.stub(window.juju.components, 'HeaderBreadcrumb');
    });

    afterEach(function() {
      stub.restore();
    });

    it('renders a normal breadcrumb', function() {
      renderer.env.set('modelOwner', 'who');
      renderer._renderBreadcrumb();
      assert.equal(renderStub.callCount, 1, 'render not invoked');
      const props = createElementStub.lastCall.args[1];
      assert.strictEqual(props['showEnvSwitcher'], true, 'showEnvSwitcher');
      assert.strictEqual(props['modelName'], 'test-model', 'modelName');
      assert.strictEqual(props['modelOwner'], 'who', 'modelOwner');
    });

    it('passes args through to the component', function() {
      var showEnvSwitcher = false;
      renderer._renderBreadcrumb({showEnvSwitcher: showEnvSwitcher});
      var props = createElementStub.lastCall.args[1];
      assert.equal(props['showEnvSwitcher'], showEnvSwitcher,
                   'The showEnvSwitcher prop was not set properly.');
    });

    it('hides the switcher when controllerAPI is not set', function() {
      renderer.controllerAPI = null;
      renderer._renderBreadcrumb();
      var props = createElementStub.lastCall.args[1];
      assert.equal(props['showEnvSwitcher'], false,
                   'The showEnvSwitcher prop was not set properly.');
    });

    it('hides the switcher when facade versions are not set', function() {
      renderer.controllerAPI.findFacadeVersion = sinon.stub().returns(null);
      renderer._renderBreadcrumb();
      var props = createElementStub.lastCall.args[1];
      assert.equal(props['showEnvSwitcher'], false,
                   'The showEnvSwitcher prop was not set properly.');
    });

    it('shows the switcher when gisf is true', function() {
      renderer.set('gisf', true);
      renderer._renderBreadcrumb();
      var props = createElementStub.lastCall.args[1];
      assert.equal(props['showEnvSwitcher'], true,
                   'The showEnvSwitcher prop was not set properly.');
    });
  });
});
