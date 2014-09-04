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


describe('machine view panel extension', function() {
  var container, db, env, models, utils, View, view, Y;
  var requirements = [
    'event-simulate', 'juju-models', 'juju-tests-utils', 'juju-views',
    'machine-view-panel-extension', 'node', 'node-event-simulate'
  ];

  before(function(done) {
    Y = YUI(GlobalConfig).use(requirements, function(Y) {
      utils = Y.namespace('juju-tests.utils');
      models = Y.namespace('juju.models');
      db = {
        services: new models.ServiceList(),
        machines: new models.MachineList(),
        units: new models.ServiceUnitList()
      };
      env = {
        after: utils.makeStubFunction(),
        get: function(arg) {
          switch (arg) {
            case 'environmentName':
              return 'Test env';
            case 'providerType':
              return 'demonstration';
          }
        }
      };
      View = Y.Base.create('machine-view-panel', Y.View, [
        Y.juju.MachineViewPanel
      ], {
        template: '<div id="machine-view-panel"></div>',
        render: function() {
          this.get('container').setHTML(this.template);
          this._renderMachineViewPanelView(db, env);
          return this;
        }
      });
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this);
    view = new View({container: container}).render();
  });

  afterEach(function() {
    view.destroy();
  });

  it('instantiates the machine view panel with the proper attrs', function() {
    var attrs = view.machineViewPanel.getAttrs();
    assert.equal(attrs.container.getAttribute('id'), 'machine-view-panel');
    assert.deepEqual(attrs.db, db);
    assert.equal(attrs.env, env);
  });

  it('can be destroyed', function() {
    assert.equal(view.machineViewPanel.get('destroyed'), false);
    view.destroyMachineViewPanel();
    assert.equal(view.machineViewPanel.get('destroyed'), true);
  });
});
