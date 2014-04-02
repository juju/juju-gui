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


describe('environment header extension', function() {
  var Y, container, utils, view, View;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['environment-header-extension',
                               'juju-tests-utils',
                               'event-simulate',
                               'event-tracker',
                               'node-event-simulate',
                               'juju-views',
                               'node'], function(Y) {

      utils = Y.namespace('juju-tests.utils');
      View = Y.Base.create('environment-header', Y.View, [
        // Because we are testing an extension which relies on mixins in the app
        // we create a view with this extension and mix in the other
        // requirements.
        Y.Event.EventTracker,
        Y.juju.EnvironmentHeader
      ], {
        template: '<div id="environment-header"></div>',
        render: function() {
          this.get('container').setHTML(this.template);
          this._renderEnvironmentHeaderView();
          return this;
        }
      });
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this);
    view = new View({container: container});
    view.render();
  });

  afterEach(function() {
    view.destroy();
  });

  it('can be destroyed', function() {
    assert.equal(view.environmentHeader.get('destroyed'), false);
    view.destroyEnvironmentHeader();
    assert.equal(view.environmentHeader.get('destroyed'), true);
  });
});
