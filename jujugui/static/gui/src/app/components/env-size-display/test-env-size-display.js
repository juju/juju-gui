/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const EnvSizeDisplay = require('./env-size-display');

describe('EnvSizeDisplay', function() {
  let appState;

  const renderComponent = (options = {}) => enzyme.shallow(
    <EnvSizeDisplay
      appState={options.appState || appState}
      machineCount={options.machineCount || 4}
      pluralize={options.pluralize || sinon.stub()}
      serviceCount={options.serviceCount || 3}
      showStatus={options.showStatus === undefined ? true : options.showStatus} />
  );

  beforeEach(function() {
    appState = {
      current: {
        gui: {
          machines: ''
        }
      },
      changeState: sinon.stub()
    };
  });

  it('shows applications and machines count', function() {
    var pluralize = sinon.stub();
    pluralize.withArgs('application').returns('applications');
    pluralize.withArgs('machine').returns('machines');
    const wrapper = renderComponent({
      pluralize: pluralize
    });
    assert.equal(
      wrapper.find('a[data-view="application"]').text(),
      '3 applications');
    assert.equal(
      wrapper.find('a[data-view="machines"]').text(),
      '4 machines');
  });

  it('highlights active tab on initial render', function() {
    const wrapper = renderComponent();
    const active = wrapper.find('.is-active a');
    assert.equal(active.length, 1);
    assert.equal(active.prop('data-view'), 'machines');
  });

  it('calls to change state when list item is clicked', function() {
    const wrapper = renderComponent();
    wrapper.find('a[data-view="machines"]').simulate('click', {
      currentTarget: {
        dataset: {
          view: 'machines'
        }
      }
    });
    wrapper.find('a[data-view="application"]').simulate('click', {
      currentTarget: {
        dataset: {
          view: 'application'
        }
      }
    });
    assert.equal(appState.changeState.callCount, 2);
    assert.deepEqual(appState.changeState.getCall(0).args[0], {
      gui: {
        machines: '',
        status: null
      }
    });
    assert.deepEqual(appState.changeState.getCall(1).args[0], {
      gui: {
        machines: null,
        status: null
      }
    });
  });
});
