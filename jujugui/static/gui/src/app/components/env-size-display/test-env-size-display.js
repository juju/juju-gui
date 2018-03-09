/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const EnvSizeDisplay = require('./env-size-display');

const testUtils = require('react-dom/test-utils');

const renderIntoDocument = testUtils.renderIntoDocument;

function queryComponentSelector(component, selector, all) {
  var queryFn = (all) ? 'querySelectorAll' : 'querySelector';
  return ReactDOM.findDOMNode(component)[queryFn](selector);
}

describe('EnvSizeDisplay', function() {
  let appState;

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
    var component = renderIntoDocument(
      <EnvSizeDisplay
        appState={appState}
        machineCount={4}
        pluralize={pluralize}
        serviceCount={3}
        showStatus={true} />);
    assert.equal(
      queryComponentSelector(
        component, 'a[data-view=application]').innerText, '3 applications');
    assert.equal(
      queryComponentSelector(
        component, 'a[data-view=machines]').innerText, '4 machines');
  });

  it('highlights active tab on initial render', function() {
    var component = renderIntoDocument(
      <EnvSizeDisplay
        appState={appState}
        machineCount={4}
        pluralize={sinon.stub()}
        serviceCount={3}
        showStatus={true} />);
    assert.notEqual(
      queryComponentSelector(
        component,
        '.env-size-display__list-item.is-active a[data-view=machines]'),
      null);
  });

  it('calls to change state when list item is clicked', function() {
    var component = renderIntoDocument(
      <EnvSizeDisplay
        appState={appState}
        machineCount={4}
        pluralize={sinon.stub()}
        serviceCount={3}
        showStatus={true} />);
    var serviceLink = queryComponentSelector(component,
      'a[data-view=application]');
    var machineLink = queryComponentSelector(component,
      'a[data-view=machines]');
    testUtils.Simulate.click(machineLink);
    testUtils.Simulate.click(serviceLink);

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

  it('highlights the tab which was clicked on', function() {
    var component = renderIntoDocument(
      <EnvSizeDisplay
        appState={appState}
        machineCount={4}
        pluralize={sinon.stub()}
        serviceCount={3}
        showStatus={true} />);
    var serviceLink = queryComponentSelector(component,
      'a[data-view=application]');
    var machineLink = queryComponentSelector(component,
      'a[data-view=machines]');

    testUtils.Simulate.click(machineLink);
    assert.notEqual(
      queryComponentSelector(
        component,
        '.env-size-display__list-item.is-active a[data-view=machines]'),
      null);
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        machines: '',
        status: null
      }
    });
    delete appState.current.gui.machine;
    delete appState.current.gui.status;
    appState.current.gui.application = true;
    testUtils.Simulate.click(serviceLink);
    component = renderIntoDocument(
      <EnvSizeDisplay
        appState={appState}
        machineCount={4}
        pluralize={sinon.stub()}
        serviceCount={3}
        showStatus={true} />);
    assert.notEqual(
      queryComponentSelector(
        component,
        '.env-size-display__list-item.is-active a[data-view=application]'),
      null);

    assert.equal(appState.changeState.callCount, 2);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        machines: '',
        status: null
      }
    });
  });
});
