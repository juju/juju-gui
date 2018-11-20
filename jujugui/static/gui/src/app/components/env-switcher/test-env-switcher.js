/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const EnvSwitcher = require('./env-switcher');

const modelResponse = require('@canonical/jujulib/tests/data/modelmanager-response');

describe('EnvSwitcher', function() {
  const renderComponent = (options = {}) => enzyme.shallow(
    <EnvSwitcher.WrappedComponent
      acl={{}}
      addNotification={options.addNotification || sinon.stub()}
      changeState={options.changeState || sinon.stub()}
      environmentName={options.environmentName || 'MyEnv'}
      listModelSummaries={options.listModelSummaries || sinon.stub()}
      modelCommitted={
        options.modelCommitted === undefined ? false : options.modelCommitted}
      setModelName={options.setModelName || sinon.stub()}
      switchModel={options.switchModel || sinon.stub()}
      user={{}} />
  );

  it('renders the closed switcher component', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('should not have an editable name when the model is committed', () => {
    const wrapper = renderComponent({modelCommitted: true});
    expect(wrapper.find('.env-switcher__name')).toMatchSnapshot();
  });

  it('defaults to "untitled-model"', () => {
    // Shallow rendering a wrapped component doesn't appear to apply the
    // defaultProps. Because other tests test that the environmentName is
    // correctly applied. This check to see that a default is defined should
    // suffice.
    assert.deepEqual(EnvSwitcher.WrappedComponent.defaultProps, {
      environmentName: 'untitled-model'
    });
  });

  it('can change the model name', () => {
    const setModelName = sinon.stub();
    const wrapper = renderComponent({setModelName});
    const instance = wrapper.instance();
    instance.refs = {
      name: {
        innerText: 'new-name'
      }
    };
    wrapper.find('.env-switcher__name').props().onBlur();
    assert.equal(setModelName.callCount, 1);
    assert.equal(setModelName.args[0][0], 'new-name');
  });

  it('does not change the model name if there is an error', () => {
    const setModelName = sinon.stub();
    const wrapper = renderComponent({setModelName});
    const instance = wrapper.instance();
    instance.refs = {
      name: {
        innerText: '-'
      }
    };
    wrapper.find('.env-switcher__name').props().onBlur();
    assert.equal(setModelName.callCount, 0);
  });

  it('can render when there is an error', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = {
      name: {
        innerText: '-'
      }
    };
    wrapper.find('.env-switcher__name').props().onBlur();
    wrapper.update();
    assert.strictEqual(wrapper.prop('className').includes('env-switcher--error'), true);
  });

  it('opens the list and fetches models on click', () => {
    const listModelSummaries =
      sinon
        .stub()
        .callsArgWith(1, null, modelResponse.listModelSummaries.response);
    const wrapper = renderComponent({listModelSummaries});
    assert.equal(wrapper.find('EnvList').length, 0);
    wrapper.find('.env-switcher__chevron').simulate('click', {
      preventDefault: () => null
    });
    const envList = wrapper.find('EnvList');
    assert.equal(envList.length, 1);
    assert.equal(envList.prop('environmentName'), 'MyEnv');
    expect(envList.prop('envs')).toMatchSnapshot();
  });

  it('can call to switch models', () => {
    // To switch environments you click on an environment list item in a sub
    // component so here we're just going to call the method that gets
    // passed down.
    const listModelSummaries =
      sinon
        .stub()
        .callsArgWith(1, null, modelResponse.listModelSummaries.response);
    const switchModel = sinon.stub();
    const wrapper = renderComponent({listModelSummaries, switchModel});
    const instance = wrapper.instance();
    const model = {
      id: 'abc123',
      name: 'Tardis',
      owner: 'The Dr.'
    };
    instance.handleModelClick(model);
    assert.equal(switchModel.callCount, 1);
    assert.deepEqual(switchModel.args[0], [model]);
  });

  it('handles errors when getting models', function() {
    const addNotification = sinon.stub();
    const listModelSummaries = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    renderComponent({listModelSummaries, addNotification});
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'unable to retrieve model list',
      message: 'unable to retrieve model list: Uh oh!',
      level: 'error'
    });
  });
});
