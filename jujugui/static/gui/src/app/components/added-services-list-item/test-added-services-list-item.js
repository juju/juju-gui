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

var juju = {components: {}}; // eslint-disable-line no-unused-vars
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('AddedServicesListItem', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('added-services-list-item', function() { done(); });
  });

  function getUnitStatusCounts(error=0, pending=0, uncommitted=0, started=0) {
    return sinon.stub().returns({
      error: {size: error, priority: 0},
      pending: {size: pending, priority: 1},
      uncommitted: {size: uncommitted, priority: 3},
      started: {size: started, priority: 2}
    });
  }

  it('renders the icon, count, visibility toggles and display name', () => {
    var service = {
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '5', name: 'demo', id: 'demo',
          units: {
            toArray: function() {
              return [];
            }}};
      },
      get: function() {
        return false;
      }};
    var renderer = jsTestUtils.shallowRender(
        <juju.components.AddedServicesListItem
          focusService={sinon.stub()}
          unfocusService={sinon.stub()}
          fadeService={sinon.stub()}
          unfadeService={sinon.stub()}
          changeState={sinon.stub()}
          getUnitStatusCounts={getUnitStatusCounts()}
          service={service} />, true);

    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();

    var expected = (
      <li className="inspector-view__list-item"
          data-serviceid="demo"
          onClick={output.props.onClick}
          tabIndex="0"
          role="button">
        <img src="icon.gif" className="inspector-view__item-icon" />
        <span className="inspector-view__item-count">5</span>
        {' '}
        <span className="inspector-view__item-name">
          demo
        </span>
        <span className="inspector-view__status-block">
          <span
            className="inspector-view__visibility-toggle"
            ref="focusVisibilityIcon"
            onClick={instance._toggleFocus}>
            <juju.components.SvgIcon name="unfocused_16" size="16"/>
          </span>
          <span
            className="inspector-view__visibility-toggle"
            ref="fadeVisibilityIcon"
            onClick={instance._toggleHighlight}>
            <juju.components.SvgIcon name="show_16" size="16"/>
          </span>
          {undefined}
        </span>
      </li>);
    assert.deepEqual(output, expected);
  });

  it('only shows the status icon for pending, uncommitted, error', function() {
    var statuses = [{
      name: 'started', icon: false,
      statusCounts: getUnitStatusCounts(0, 0, 0, 1)
    }, {
      name: 'uncommitted', icon: true, statusCounts:
      getUnitStatusCounts(0, 0, 1)
    }, {
      name: 'pending', icon: true,
      statusCounts: getUnitStatusCounts(0, 1)
    }, {
      name: 'error', icon: true,
      statusCounts: getUnitStatusCounts(1)
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
            icon: 'icon.gif', unit_count: '1', name: 'demo', id: 'demo',
            units: {
              toArray: function() {
                return [{agent_state: status.name}];
              }}};
        },
        get: function() {
          return false;
        }};
      var renderer = jsTestUtils.shallowRender(
          <juju.components.AddedServicesListItem
            focusService={sinon.stub()}
            unfocusService={sinon.stub()}
            fadeService={sinon.stub()}
            unfadeService={sinon.stub()}
            changeState={sinon.stub()}
            getUnitStatusCounts={status.statusCounts}
            service={service} />, true);

      var output = renderer.getRenderOutput();
      var instance = renderer.getMountedInstance();

      assert.deepEqual(output,
        <li className="inspector-view__list-item"
            data-serviceid="demo"
            onClick={output.props.onClick}
            tabIndex="0"
            role="button">
          <img src="icon.gif" className="inspector-view__item-icon" />
          <span className="inspector-view__item-count">1</span>
          {' '}
          <span className="inspector-view__item-name">
            demo
          </span>
          <span className="inspector-view__status-block">
            <span
              className="inspector-view__visibility-toggle"
              ref="focusVisibilityIcon"
              onClick={instance._toggleFocus}>
              <juju.components.SvgIcon name="unfocused_16" size="16"/>
            </span>
            <span
              className="inspector-view__visibility-toggle"
              ref="fadeVisibilityIcon"
              onClick={instance._toggleHighlight}>
              <juju.components.SvgIcon name="show_16" size="16"/>
            </span>
            {statusIcon(status)}
          </span>
        </li>);
    });
  });

  it('gracefully falls back if status is unknown', function() {
    var service = {
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '5', name: 'demo', id: 'demo',
          units: {
            toArray: function() {
              return [{agent_state: 'unknown-state'}];
            }}};
      },
      get: function() {
        return false;
      }};

    var renderer = jsTestUtils.shallowRender(
      <juju.components.AddedServicesListItem
        focusService={sinon.stub()}
        unfocusService={sinon.stub()}
        fadeService={sinon.stub()}
        unfadeService={sinon.stub()}
        changeState={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts()}
        service={service} />, true);

    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();

    assert.deepEqual(output,
        <li className="inspector-view__list-item"
            data-serviceid="demo"
            onClick={output.props.onClick}
            tabIndex="0"
            role="button">
          <img src="icon.gif" className="inspector-view__item-icon" />
          <span className="inspector-view__item-count">5</span>
          {' '}
          <span className="inspector-view__item-name">
            demo
          </span>
          <span className="inspector-view__status-block">
            <span
              className="inspector-view__visibility-toggle"
              ref="focusVisibilityIcon"
              onClick={instance._toggleFocus}>
              <juju.components.SvgIcon name="unfocused_16" size="16"/>
            </span>
            <span
              className="inspector-view__visibility-toggle"
              ref="fadeVisibilityIcon"
              onClick={instance._toggleHighlight}>
              <juju.components.SvgIcon name="show_16" size="16"/>
            </span>
            {undefined}
          </span>
        </li>);
  });

  it('prioiritizes error, over pending status icon', function() {
    var service = {
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '2', name: 'demo', id: 'demo',
          units: {
            toArray: function() {
              return [{agent_state: 'pending'}, {agent_state: 'error'}];
            }}};
      },
      get: function() {
        return false;
      }};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.AddedServicesListItem
        focusService={sinon.stub()}
        unfocusService={sinon.stub()}
        fadeService={sinon.stub()}
        unfadeService={sinon.stub()}
        changeState={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts(1, 1)}
        service={service} />, true);

    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();

    assert.deepEqual(output,
        <li className="inspector-view__list-item"
            data-serviceid="demo"
            onClick={output.props.onClick}
            tabIndex="0"
            role="button">
          <img src="icon.gif" className="inspector-view__item-icon" />
          <span className="inspector-view__item-count">2</span>
          {' '}
          <span className="inspector-view__item-name">
            demo
          </span>
          <span className="inspector-view__status-block">
            <span
              className="inspector-view__visibility-toggle"
              ref="focusVisibilityIcon"
              onClick={instance._toggleFocus}>
              <juju.components.SvgIcon name="unfocused_16" size="16"/>
            </span>
            <span
              className="inspector-view__visibility-toggle"
              ref="fadeVisibilityIcon"
              onClick={instance._toggleHighlight}>
              <juju.components.SvgIcon name="show_16" size="16"/>
            </span>
            <span className="inspector-view__status--error">1</span>
          </span>
        </li>);
  });

  it('prioritizes pending over uncommitted status icon', function() {
    var service = {
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '2', name: 'demo', id: 'demo',
          units: {
            toArray: function() {
              return [{agent_state: 'uncommitted'}, {agent_state: 'pending'}];
            }}};
      },
      get: function() {
        return false;
      }};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.AddedServicesListItem
        focusService={sinon.stub()}
        unfocusService={sinon.stub()}
        fadeService={sinon.stub()}
        unfadeService={sinon.stub()}
        changeState={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts(0, 1, 1)}
        service={service} />, true);

    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();

    assert.deepEqual(output,
        <li className="inspector-view__list-item"
            data-serviceid="demo"
            onClick={output.props.onClick}
            tabIndex="0"
            role="button">
          <img src="icon.gif" className="inspector-view__item-icon" />
          <span className="inspector-view__item-count">2</span>
          {' '}
          <span className="inspector-view__item-name">
            demo
          </span>
          <span className="inspector-view__status-block">
            <span
              className="inspector-view__visibility-toggle"
              ref="focusVisibilityIcon"
              onClick={instance._toggleFocus}>
              <juju.components.SvgIcon name="unfocused_16" size="16"/>
            </span>
            <span
              className="inspector-view__visibility-toggle"
              ref="fadeVisibilityIcon"
              onClick={instance._toggleHighlight}>
              <juju.components.SvgIcon name="show_16" size="16"/>
            </span>
            <span className="inspector-view__status--pending">1</span>
          </span>
        </li>);
  });

  it('calls the changeState callable on click', function() {
    var service = {
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '5', name: 'demo', id: 'demo',
          units: {
            toArray: function() {
              return [];
            }}};
      },
      get: function() {
        return false;
      }};
    var changeStub = sinon.stub();
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.AddedServicesListItem
          focusService={sinon.stub()}
          unfocusService={sinon.stub()}
          fadeService={sinon.stub()}
          unfadeService={sinon.stub()}
          changeState={changeStub}
          getUnitStatusCounts={getUnitStatusCounts()}
          service={service} />);
    var output = shallowRenderer.getRenderOutput();
    output.props.onClick({
      currentTarget: {
        getAttribute: () => 'serviceId'
      }
    });
    assert.equal(changeStub.callCount, 1);
    assert.deepEqual(changeStub.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: { id: 'serviceId' }
      }
    });
  });

  it('correctly sets the visibility icons status on render', () => {
    var service = {
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '2', name: 'demo', id: 'demo',
          units: {
            toArray: function() {
              return [{agent_state: 'uncommitted'}, {agent_state: 'pending'}];
            }}};
      },
      get: function() {
        return true;
      }};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.AddedServicesListItem
        focusService={sinon.stub()}
        unfocusService={sinon.stub()}
        fadeService={sinon.stub()}
        unfadeService={sinon.stub()}
        changeState={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        service={service} />, true);

    var instance = renderer.getMountedInstance();
    assert.equal(instance.state.focus, true);
    assert.equal(instance.state.fade, true);

    // This is ugly but we have to check that the proper name prop was passed
    // to the SvgIcon component.
    var output = renderer.getRenderOutput();
    assert.deepEqual(
      output.props.children[4].props.children[0].props.children,
      <juju.components.SvgIcon name="focused_16" size="16"/>);
    assert.deepEqual(
      output.props.children[4].props.children[1].props.children,
      <juju.components.SvgIcon name="hide_16" size="16"/>);
  });

  it('correctly sets the visibility icons status on re-render', () => {
    var service = {
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '2', name: 'demo', id: 'demo',
          units: {
            toArray: function() {
              return [{agent_state: 'uncommitted'}, {agent_state: 'pending'}];
            }}};
      },
      get: function() {
        return true;
      }};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.AddedServicesListItem
        focusService={sinon.stub()}
        unfocusService={sinon.stub()}
        fadeService={sinon.stub()}
        unfadeService={sinon.stub()}
        changeState={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        service={service} />, true);

    var instance = renderer.getMountedInstance();
    assert.equal(instance.state.focus, true);
    assert.equal(instance.state.fade, true);

    // This is ugly but we have to check that the proper name prop was passed
    // to the SvgIcon component.
    var output = renderer.getRenderOutput();
    assert.deepEqual(
      output.props.children[4].props.children[0].props.children,
      <juju.components.SvgIcon name="focused_16" size="16"/>);
    assert.deepEqual(
      output.props.children[4].props.children[1].props.children,
      <juju.components.SvgIcon name="hide_16" size="16"/>);
    // Re-render to trigger the componentWillReceiveProps.
    renderer.render(
      <juju.components.AddedServicesListItem
        focusService={sinon.stub()}
        unfocusService={sinon.stub()}
        fadeService={sinon.stub()}
        unfadeService={sinon.stub()}
        changeState={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        service={service} />);
    var output = renderer.getRenderOutput();
    assert.deepEqual(
      output.props.children[4].props.children[0].props.children,
      <juju.components.SvgIcon name="focused_16" size="16"/>);
    assert.deepEqual(
      output.props.children[4].props.children[1].props.children,
      <juju.components.SvgIcon name="hide_16" size="16"/>);
  });

  it('toggles the focus icon and calls the correct prop on click', () => {
    var service = {
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '2', name: 'demo', id: 'demo',
          units: {
            toArray: function() {
              return [{agent_state: 'uncommitted'}, {agent_state: 'pending'}];
            }}};
      },
      get: function(key) {
        if (key === 'id') {
          return 'wordpress';
        }
        return false;
      }};
    var focusService = sinon.stub();
    var unfocusService = sinon.stub();
    var instance = testUtils.renderIntoDocument(
      <juju.components.AddedServicesListItem
        focusService={focusService}
        unfocusService={unfocusService}
        fadeService={sinon.stub()}
        unfadeService={sinon.stub()}
        changeState={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        service={service} />);

    // Toggle focus on.
    assert.equal(instance.state.focus, false);
    testUtils.Simulate.click(instance.refs.focusVisibilityIcon);
    assert.equal(instance.state.focus, true);
    assert.equal(focusService.callCount, 1);
    assert.equal(unfocusService.callCount, 0);
    assert.equal(focusService.args[0][0], 'wordpress');

    // Toggle focus off.
    testUtils.Simulate.click(instance.refs.focusVisibilityIcon);
    assert.equal(instance.state.focus, false);
    assert.equal(focusService.callCount, 1);
    assert.equal(unfocusService.callCount, 1);
    assert.equal(focusService.args[0][0], 'wordpress');
  });

  it('toggles the highlight icon and calls the correct prop on click', () => {
    var service = {
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '2', name: 'demo', id: 'demo',
          units: {
            toArray: function() {
              return [{agent_state: 'uncommitted'}, {agent_state: 'pending'}];
            }}};
      },
      get: function(key) {
        if (key === 'id') {
          return 'wordpress';
        }
        return false;
      }};
    var fadeService = sinon.stub();
    var unfadeService = sinon.stub();
    var instance = testUtils.renderIntoDocument(
      <juju.components.AddedServicesListItem
        focusService={sinon.stub()}
        unfocusService={sinon.stub()}
        fadeService={fadeService}
        unfadeService={unfadeService}
        changeState={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        service={service} />);

    // Check that the container has the proper classes when no visibility
    // toggle is active.
    assert.equal(
      ReactDOM.findDOMNode(instance).classList,
      'inspector-view__list-item');
    // Toggle focus on.
    assert.equal(instance.state.fade, false);
    testUtils.Simulate.click(instance.refs.fadeVisibilityIcon);
    assert.equal(instance.state.fade, true);
    assert.equal(fadeService.callCount, 1);
    assert.equal(unfadeService.callCount, 0);
    assert.equal(fadeService.args[0][0], 'wordpress');
    // Check that the container has the proper classes when a visibility
    // toggle is active.
    assert.equal(
      ReactDOM.findDOMNode(instance).classList,
      'inspector-view__list-item visibility-toggled');

    // Toggle focus off.
    testUtils.Simulate.click(instance.refs.fadeVisibilityIcon);
    assert.equal(instance.state.fade, false);
    assert.equal(fadeService.callCount, 1);
    assert.equal(unfadeService.callCount, 1);
    assert.equal(fadeService.args[0][0], 'wordpress');
  });

});
