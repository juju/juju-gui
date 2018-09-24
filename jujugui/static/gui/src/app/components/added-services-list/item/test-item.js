/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const enzyme = require('enzyme');
const React = require('react');
const shapeup = require('shapeup');

const AddedServicesListItem = require('./item');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('AddedServicesListItem', function() {
  let mockService, serviceModule;

  const renderComponent = (options = {}) => enzyme.shallow(
    <AddedServicesListItem
      changeState={options.changeState || sinon.stub()}
      service={options.service || mockService}
      serviceModule={options.serviceModule || serviceModule} />
  );

  beforeEach(function() {
    mockService = jsTestUtils.makeModel();
    serviceModule = {
      hoverService: sinon.stub(),
      panToService: sinon.stub(),
      reshape: shapeup.reshapeFunc
    };
  });

  it('renders the icon, count, visibility toggles and display name', () => {
    mockService.set('highlight', false);
    mockService.set('fade', false);
    const wrapper = renderComponent();
    const expected = (
      <li
        className="inspector-view__list-item"
        data-serviceid="wordpress"
        onClick={wrapper.prop('onClick')}
        onMouseEnter={wrapper.prop('onMouseEnter')}
        onMouseLeave={wrapper.prop('onMouseLeave')}
        role="button"
        tabIndex="0">
        <img className="inspector-view__item-icon" src="icon.gif" />
        <span className="inspector-view__item-count">2</span>
        {' '}
        <span className="inspector-view__item-name">
          demo
        </span>
        <span className="inspector-view__status-block">
          <span className="inspector-view__status--pending">
            1
          </span>
        </span>
      </li>);
    assert.compareJSX(wrapper, expected);
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

    statuses.forEach((status, i) => {
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
      const wrapper = renderComponent({service});
      const expected = (
        <span className="inspector-view__status-block">
          {statusIcon(status)}
        </span>);
      assert.compareJSX(wrapper.find('.inspector-view__status-block'), expected);
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
    const wrapper = renderComponent({service});
    const expected = (
      <span className="inspector-view__status-block">
        {undefined}
      </span>);
    assert.compareJSX(wrapper.find('.inspector-view__status-block'), expected);
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
    const wrapper = renderComponent({service});
    assert.equal(wrapper.find('.inspector-view__status--error').length, 1);
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
    const wrapper = renderComponent({service});
    assert.equal(wrapper.find('.inspector-view__status--pending').length, 1);
  });

  it('calls the changeState callable on click', function() {
    const service = {
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
    const changeState = sinon.stub();
    const wrapper = renderComponent({
      changeState,
      service
    });
    wrapper.props().onClick({
      currentTarget: {
        getAttribute: () => 'serviceId'
      }
    });
    assert.equal(serviceModule.panToService.callCount, 1);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
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
    const wrapper = renderComponent({
      service
    });
    wrapper.props().onMouseEnter();
    assert.equal(serviceModule.hoverService.callCount, 1);
    assert.equal(serviceModule.hoverService.args[0][0], 'apache2');
    assert.isTrue(serviceModule.hoverService.args[0][1]);
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
    const wrapper = renderComponent({
      service
    });
    wrapper.props().onMouseLeave();
    assert.equal(serviceModule.hoverService.callCount, 1);
    assert.equal(serviceModule.hoverService.args[0][0], 'apache2');
    assert.isFalse(serviceModule.hoverService.args[0][1]);
  });
});
