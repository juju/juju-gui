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
    juju.components.ServiceOverview.prototype.icons = {};
    shallowRenderer.render(
          <juju.components.ServiceOverview
            service={service}/>);
    var output = shallowRenderer.getRenderOutput();
    var value = 2;
    var none = undefined;
    assert.deepEqual(output.props.children[0],
      <juju.components.OverviewAction
        key="Units"
        title="Units"
        value={value}
        icon={none}
        action={none}
        valueType={none}
        link={none}
        linkTitle={none} />);
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
    juju.components.ServiceOverview.prototype.icons = {};
    shallowRenderer.render(
          <juju.components.ServiceOverview
            service={service}/>);
    var output = shallowRenderer.getRenderOutput();
    var value = 3;
    var none = undefined;
    assert.deepEqual(output.props.children[1],
      <juju.components.OverviewAction
        key="Uncommitted"
        title="Uncommitted"
        value={value}
        icon={none}
        action={none}
        valueType="uncommitted"
        link={none}
        linkTitle={none} />);
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
    juju.components.ServiceOverview.prototype.icons = {};
    shallowRenderer.render(
          <juju.components.ServiceOverview
            service={service}/>);
    var output = shallowRenderer.getRenderOutput();
    var value = 1;
    var none = undefined;
    assert.deepEqual(output.props.children[1],
      <juju.components.OverviewAction
        key="Pending"
        title="Pending"
        value={value}
        icon={none}
        action={none}
        valueType='pending'
        link={none}
        linkTitle={none} />);
  });

  it('shows the errors units action', function() {
    var service = {
      get: function() {
        return {
          toArray: function() {
            return [{agent_state: 'error'}];
          }
        };
      }};
    var shallowRenderer = testUtils.createRenderer();
    juju.components.ServiceOverview.prototype.icons = {};
    shallowRenderer.render(
          <juju.components.ServiceOverview
            service={service}/>);
    var output = shallowRenderer.getRenderOutput();
    var value = 1;
    var none = undefined;
    assert.deepEqual(output.props.children[1],
      <juju.components.OverviewAction
        key="Errors"
        title="Errors"
        value={value}
        icon={none}
        action={none}
        valueType="error"
        link={none}
        linkTitle={none} />);
  });
});
