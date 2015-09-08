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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('AddedServicesListItem', function() {
  var listItemStub;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('added-services-list-item', function() { done(); });
  });

  it('renders the icon, count and display name', function() {
    var service = {
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '5', name: 'demo',
          units: {
            toArray: function() {
              return [];
            }}};
      }};

    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.AddedServicesListItem
          service={service} />);

    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children, [
      <img src="icon.gif" className="inspector-view__item-icon" />,
      <span className="inspector-view__item-count">5</span>,' ' ,'demo',
      undefined
    ]);
  });

  it('only shows the status icon for pending, uncommitted, error', function() {
    var statuses = [{
      name: 'started', icon: false
    }, {
      name: 'uncommitted', icon: true
    }, {
      name: 'pending', icon: true
    }, {
      name: 'error', icon: true
    }];

    // Generate what the icon should look like depending on the value in
    // the statuses array.
    function statusIcon(status) {
      if (status.icon) {
        var className = 'inspector-view__status--' + status.name;
        return <span className={className}>1</span>;
      }
      return undefined;
    }

    statuses.forEach(function(status) {
      var service = {
        getAttrs: function() {
          return {
            icon: 'icon.gif', unit_count: '1', name: 'demo',
            units: {
              toArray: function() {
                return [{agent_state: status.name}];
              }}};
        }};

      var shallowRenderer = testUtils.createRenderer();
      shallowRenderer.render(
          <juju.components.AddedServicesListItem
            service={service} />);

      var output = shallowRenderer.getRenderOutput();
      assert.deepEqual(output.props.children, [
        <img src="icon.gif" className="inspector-view__item-icon" />,
        <span className="inspector-view__item-count">1</span>,' ' ,'demo',
        statusIcon(status)
      ]);
    });
  });

  it('gracefully falls back if status is unknown', function() {
    var service = {
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '5', name: 'demo',
          units: {
            toArray: function() {
              return [{agent_state: 'unknown-state'}];
            }}};
      }};

    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.AddedServicesListItem
          service={service} />);

    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children, [
      <img src="icon.gif" className="inspector-view__item-icon" />,
      <span className="inspector-view__item-count">5</span>,' ' ,'demo',
      undefined
    ]);
  });

  it('prioiritizes error, over pending status icon', function() {
    var service = {
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '2', name: 'demo',
          units: {
            toArray: function() {
              return [{agent_state: 'pending'}, {agent_state: 'error'}];
            }}};
      }};

    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.AddedServicesListItem
          service={service} />);

    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children, [
      <img src="icon.gif" className="inspector-view__item-icon" />,
      <span className="inspector-view__item-count">2</span>,' ' ,'demo',
      <span className="inspector-view__status--error">1</span>
    ]);
  });

  it('prioritizes pending over uncommitted status icon', function() {
    var service = {
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '2', name: 'demo',
          units: {
            toArray: function() {
              return [{agent_state: 'uncommitted'}, {agent_state: 'pending'}];
            }}};
      }};

    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.AddedServicesListItem
          service={service} />);

    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children, [
      <img src="icon.gif" className="inspector-view__item-icon" />,
      <span className="inspector-view__item-count">2</span>,' ' ,'demo',
      <span className="inspector-view__status--pending">1</span>
    ]);
  });

});
