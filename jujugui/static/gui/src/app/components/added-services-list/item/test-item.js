/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const AddedServicesListItem = require('./item');

const jsTestUtils = require('../../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('AddedServicesListItem', function() {
  var mockService;

  beforeEach(function() {
    mockService = jsTestUtils.makeModel();
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
    mockService.set('highlight', false);
    mockService.set('fade', false);

    var renderer = jsTestUtils.shallowRender(
      <AddedServicesListItem
        focusService={sinon.stub()}
        unfocusService={sinon.stub()}
        changeState={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts()}
        hoverService={sinon.stub()}
        panToService={sinon.stub()}
        service={mockService} />, true);

    var output = renderer.getRenderOutput();

    var expected = (
      <li className="inspector-view__list-item"
        data-serviceid="wordpress"
        onClick={output.props.onClick}
        onMouseEnter={output.props.onMouseEnter}
        onMouseLeave={output.props.onMouseLeave}
        tabIndex="0"
        role="button">
        <img src="icon.gif" className="inspector-view__item-icon" />
        <span className="inspector-view__item-count">2</span>
        {' '}
        <span className="inspector-view__item-name">
          demo
        </span>
        <span className="inspector-view__status-block">
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
        <AddedServicesListItem
          focusService={sinon.stub()}
          unfocusService={sinon.stub()}
          changeState={sinon.stub()}
          getUnitStatusCounts={status.statusCounts}
          hoverService={sinon.stub()}
          panToService={sinon.stub()}
          service={service} />, true);

      var output = renderer.getRenderOutput();

      assert.deepEqual(output,
        <li className="inspector-view__list-item"
          data-serviceid="demo"
          onClick={output.props.onClick}
          onMouseEnter={output.props.onMouseEnter}
          onMouseLeave={output.props.onMouseLeave}
          tabIndex="0"
          role="button">
          <img src="icon.gif" className="inspector-view__item-icon" />
          <span className="inspector-view__item-count">1</span>
          {' '}
          <span className="inspector-view__item-name">
            demo
          </span>
          <span className="inspector-view__status-block">
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
      <AddedServicesListItem
        focusService={sinon.stub()}
        unfocusService={sinon.stub()}
        changeState={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts()}
        hoverService={sinon.stub()}
        panToService={sinon.stub()}
        service={service} />, true);

    var output = renderer.getRenderOutput();

    assert.deepEqual(output,
      <li className="inspector-view__list-item"
        data-serviceid="demo"
        onClick={output.props.onClick}
        onMouseEnter={output.props.onMouseEnter}
        onMouseLeave={output.props.onMouseLeave}
        tabIndex="0"
        role="button">
        <img src="icon.gif" className="inspector-view__item-icon" />
        <span className="inspector-view__item-count">5</span>
        {' '}
        <span className="inspector-view__item-name">
            demo
        </span>
        <span className="inspector-view__status-block">
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
      <AddedServicesListItem
        focusService={sinon.stub()}
        unfocusService={sinon.stub()}
        changeState={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts(1, 1)}
        hoverService={sinon.stub()}
        panToService={sinon.stub()}
        service={service} />, true);

    var output = renderer.getRenderOutput();

    assert.deepEqual(output,
      <li className="inspector-view__list-item"
        data-serviceid="demo"
        onClick={output.props.onClick}
        onMouseEnter={output.props.onMouseEnter}
        onMouseLeave={output.props.onMouseLeave}
        tabIndex="0"
        role="button">
        <img src="icon.gif" className="inspector-view__item-icon" />
        <span className="inspector-view__item-count">2</span>
        {' '}
        <span className="inspector-view__item-name">
            demo
        </span>
        <span className="inspector-view__status-block">
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
      <AddedServicesListItem
        focusService={sinon.stub()}
        unfocusService={sinon.stub()}
        changeState={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts(0, 1, 1)}
        hoverService={sinon.stub()}
        panToService={sinon.stub()}
        service={service} />, true);

    var output = renderer.getRenderOutput();

    assert.deepEqual(output,
      <li className="inspector-view__list-item"
        data-serviceid="demo"
        onClick={output.props.onClick}
        onMouseEnter={output.props.onMouseEnter}
        onMouseLeave={output.props.onMouseLeave}
        tabIndex="0"
        role="button">
        <img src="icon.gif" className="inspector-view__item-icon" />
        <span className="inspector-view__item-count">2</span>
        {' '}
        <span className="inspector-view__item-name">
            demo
        </span>
        <span className="inspector-view__status-block">
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
    var panToService = sinon.stub();
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <AddedServicesListItem
        focusService={sinon.stub()}
        unfocusService={sinon.stub()}
        changeState={changeStub}
        getUnitStatusCounts={getUnitStatusCounts()}
        hoverService={sinon.stub()}
        panToService={panToService}
        service={service} />);
    var output = shallowRenderer.getRenderOutput();
    output.props.onClick({
      currentTarget: {
        getAttribute: () => 'serviceId'
      }
    });
    assert.equal(panToService.callCount, 1);
    assert.equal(changeStub.callCount, 1);
    assert.deepEqual(changeStub.args[0][0], {
      gui: {
        inspector: {
          id: 'serviceId'
        }
      }
    });
  });

  it('calls the hoverService callable on mouse enter', function() {
    var service = {
      get: sinon.stub().returns('apache2'),
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '5', name: 'demo', id: 'demo',
          units: {
            toArray: function() {
              return [];
            }}};
      }};
    var changeStub = sinon.stub();
    var hoverService = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <AddedServicesListItem
        changeState={changeStub}
        focusService={sinon.stub()}
        hoverService={hoverService}
        getUnitStatusCounts={getUnitStatusCounts()}
        panToService={sinon.stub()}
        service={service}
        unfocusService={sinon.stub()} />);
    output.props.onMouseEnter();
    assert.equal(hoverService.callCount, 1);
    assert.equal(hoverService.args[0][0], 'apache2');
    assert.isTrue(hoverService.args[0][1]);
  });

  it('calls the hoverService callable on mouse leave', function() {
    var service = {
      get: sinon.stub().returns('apache2'),
      getAttrs: function() {
        return {
          icon: 'icon.gif', unit_count: '5', name: 'demo', id: 'demo',
          units: {
            toArray: function() {
              return [];
            }}};
      }};
    var changeStub = sinon.stub();
    var hoverService = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <AddedServicesListItem
        changeState={changeStub}
        focusService={sinon.stub()}
        hoverService={hoverService}
        getUnitStatusCounts={getUnitStatusCounts()}
        panToService={sinon.stub()}
        service={service}
        unfocusService={sinon.stub()} />);
    output.props.onMouseLeave();
    assert.equal(hoverService.callCount, 1);
    assert.equal(hoverService.args[0][0], 'apache2');
    assert.isFalse(hoverService.args[0][1]);
  });
});
