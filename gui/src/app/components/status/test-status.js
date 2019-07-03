/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');
const shapeup = require('shapeup');

const Analytics = require('test/fake-analytics');
const Status = require('./status');

describe('Status', function() {
  let changeState, generatePath, model, valueStore;
  const propTypes = Status.propTypes;

  const renderComponent = (options = {}) => enzyme.shallow(
    <Status
      analytics={Analytics}
      changeState={options.changeState || changeState}
      generatePath={options.generatePath || generatePath}
      model={shapeup.fromShape(options.model || model, propTypes.model)}
      valueStore={options.valueStore || valueStore} />
  );

  beforeEach(() => {
    changeState = sinon.stub();
    model = {
      cloud: 'aws',
      environmentName: 'my-model',
      modelUUID: 'myuuid',
      region: 'neutral zone',
      sla: 'advanced',
      version: '2.42.47'
    };
    valueStore = {
      applications: {app: {}},
      machines: {machine: {}},
      relations: {relation: {}},
      remoteApplications: {app: {}},
      units: {unit: {}}
    };
    generatePath = sinon.stub();
  });

  it('can navigate to charms from the app list', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._navigateToCharm(
      'u/who/django/xenial/42', {preventDefault: sinon.stub()});
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(
      changeState.args[0][0], {store: 'u/who/django/xenial/42'});
  });

  it('can navigate to apps from the relation list', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._navigateToApplication('mysql', {preventDefault: sinon.stub()});
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'mysql',
          activeComponent: undefined,
          unit: null,
          unitStatus: null
        }
      }
    });
  });
});
