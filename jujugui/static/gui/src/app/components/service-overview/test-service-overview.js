/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

describe('ServiceOverview', function() {
  var listItemStub;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('service-overview', function() { done(); });
  });

  it('shows the all units action', function() {
    var service = {
      get: function() {
        return {
          toArray: function() {
            return [{}, {}];
          }
        };
      }};
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
          <juju.components.ServiceOverview
            service={service}/>);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.children[0].props.title, 'Units');
    assert.equal(output.props.children[0].props.value, 2);
  });

  it('shows the uncommitted units action', function() {
    var service = {
      get: function() {
        return {
          toArray: function() {
            return [
              {agent_state: 'uncommitted'},
              {agent_state: 'started'},
              {}
              ];
          }
        };
      }};
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
          <juju.components.ServiceOverview
            service={service}/>);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.children[1].props.title, 'Uncommitted');
    assert.equal(output.props.children[1].props.value, 3);
  });

  it('shows the pending units action', function() {
    var service = {
      get: function() {
        return {
          toArray: function() {
            return [{agent_state: 'pending'}];
          }
        };
      }};
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
          <juju.components.ServiceOverview
            service={service}/>);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.children[1].props.title, 'Pending');
    assert.equal(output.props.children[1].props.value, 1);
  });

  it('shows the pending units action', function() {
    var service = {
      get: function() {
        return {
          toArray: function() {
            return [{agent_state: 'error'}];
          }
        };
      }};
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
          <juju.components.ServiceOverview
            service={service}/>);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.children[1].props.title, 'Errors');
    assert.equal(output.props.children[1].props.value, 1);
  });
});
