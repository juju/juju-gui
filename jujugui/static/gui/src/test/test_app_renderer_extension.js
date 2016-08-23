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
      utils,
      Y;

  before(function(done) {
    var requires = [
      'base',
      'app-renderer-extension',
      'juju-tests-utils'
    ];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
      juju = Y.namespace('juju');
      utils = Y.namespace('juju-tests.utils');
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
    renderStub = utils.makeStubMethod(ReactDOM, 'render');
    this._cleanups.push(renderStub.reset);
    createElementStub = utils.makeStubMethod(React, 'createElement');
    this._cleanups.push(createElementStub.reset);
    // Bootstrap various renderer attributes and properties.
    var ecs = {
      getCurrentChangeSet: utils.makeStubFunction({})
    };
    var Env = Y.Base.create('env', Y.Base, [], {
    }, {
      ATTRS: {
        ecs: {}
      }
    });
    renderer.env = new Env({ecs: ecs});
    renderer.controllerAPI = {
      findFacadeVersion: utils.makeStubFunction(),
      listModelsWithInfo: utils.makeStubFunction()
    };

    renderer.set('sandbox', false);
    renderer._getAuth = utils.makeStubFunction({user: 'test'});

    renderer.state = {
      getState: utils.makeStubFunction()
    };
    renderer.db = {
      environment: {
        set: utils.makeStubFunction(),
        get: utils.makeStubFunction('test-model')
      }
    };
    renderer.changeState = utils.makeStubFunction();
    renderer.switchEnv = utils.makeStubFunction();
    renderer.createSocketURL = utils.makeStubFunction();
  });

  afterEach(function() {
    renderer.destroy();
  });

  describe('_renderBreadcrumb', function() {
    beforeEach(function() {
      var stub = utils.makeStubMethod(window.juju.components,
                                      'HeaderBreadcrumb');
      this._cleanups.push(stub.reset);
    });

    it('renders a normal breadcrumb', function() {
      renderer._renderBreadcrumb();
      assert.equal(renderStub.callCount(), 1,
                   'React\'s render was not invoked.');
      var props = createElementStub.lastArguments()[1];
      assert.equal(props['showEnvSwitcher'], true,
                   'The showEnvSwitcher prop was not set properly.');
      assert.equal(props['envName'], 'test-model',
                   'The envName prop was not set properly.');
    });

    it('passes args through to the component', function() {
      var showEnvSwitcher = false;
      renderer._renderBreadcrumb({showEnvSwitcher: showEnvSwitcher});
      var props = createElementStub.lastArguments()[1];
      assert.equal(props['showEnvSwitcher'], showEnvSwitcher,
                   'The showEnvSwitcher prop was not set properly.');
    });

    it('hides the switcher when controllerAPI is not set', function() {
      renderer.controllerAPI = null;
      renderer._renderBreadcrumb();
      var props = createElementStub.lastArguments()[1];
      assert.equal(props['showEnvSwitcher'], false,
                   'The showEnvSwitcher prop was not set properly.');
    });

    it('hides the switcher when facade versions are not set', function() {
      renderer.controllerAPI.findFacadeVersion =
        utils.makeStubFunction(null, null);
      renderer._renderBreadcrumb();
      var props = createElementStub.lastArguments()[1];
      assert.equal(props['showEnvSwitcher'], false,
                   'The showEnvSwitcher prop was not set properly.');
    });

    it('hides the switcher when in sandbox mode', function() {
      renderer.set('sandbox', true);
      renderer._renderBreadcrumb();
      var props = createElementStub.lastArguments()[1];
      assert.equal(props['showEnvSwitcher'], false,
                   'The showEnvSwitcher prop was not set properly.');
    });

    it('shows the switcher when gisf is true', function() {
      renderer.set('gisf', true);
      renderer._renderBreadcrumb();
      var props = createElementStub.lastArguments()[1];
      assert.equal(props['showEnvSwitcher'], true,
                   'The showEnvSwitcher prop was not set properly.');
    });
  });
});
