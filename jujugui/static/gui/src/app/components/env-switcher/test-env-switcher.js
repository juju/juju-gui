/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const EnvSwitcher = require('./env-switcher');
const SvgIcon = require('../svg-icon/svg-icon');

describe('EnvSwitcher', function() {
  const renderComponent = (options = {}) => enzyme.shallow(
    <EnvSwitcher.WrappedComponent
      acl={{}}
      addNotification={options.addNotification || sinon.stub()}
      changeState={options.changeState || sinon.stub()}
      environmentName={options.environmentName || 'MyEnv'}
      humanizeTimestamp={options.humanizeTimestamp || sinon.stub()}
      listModelsWithInfo={options.listModelsWithInfo || sinon.stub()}
      modelCommitted={
        options.modelCommitted === undefined ? false : options.modelCommitted}
      setModelName={options.setModelName || sinon.stub()}
      showProfile={options.showProfile || sinon.stub()}
      switchModel={options.switchModel || sinon.stub()} />
  );

  it('renders the closed switcher component', () => {
    const wrapper = renderComponent();
    const expected = (
      <div aria-label="Model switcher"
        className="env-switcher"
        onClick={null}
        role="navigation"
        tabIndex="0">
        <div className="env-switcher__toggle editable">
          <div>
            <span className="env-switcher__name"
              contentEditable={true}
              dangerouslySetInnerHTML={{__html: 'MyEnv'}}
              onBlur={wrapper.find('.env-switcher__name').prop('onBlur')}
              onFocus={wrapper.find('.env-switcher__name').prop('onFocus')}
              ref="name" />
            <div className="env-switcher__name-error">
              The model name must only contain lowercase letters, numbers, and hyphens.
              It must not start or end with a hyphen.
            </div>
          </div>
          <div aria-controls="environmentSwitcherMenu"
            aria-expanded="false"
            aria-haspopup="true"
            aria-owns="environmentSwitcherMenu"
            className="env-switcher__chevron"
            id="environmentSwitcherToggle"
            onClick={wrapper.find('.env-switcher__chevron').prop('onClick')}
            onKeyPress={wrapper.find('.env-switcher__chevron').prop('onKeyPress')}
            role="button"
            tabIndex="0">
            <SvgIcon
              name="chevron_down_16"
              size="16" />
          </div>
        </div>
        {undefined}
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('should not have an editable name when the model is committed', () => {
    const wrapper = renderComponent({modelCommitted: true});
    const expected = (
      <span className="env-switcher__name"
        ref="name">
        MyEnv
      </span>);
    assert.compareJSX(wrapper.find('.env-switcher__name'), expected);
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
    const wrapper = renderComponent({ setModelName });
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
    const wrapper = renderComponent({ setModelName });
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

  it('opens the list on click', () => {
    const models = [{ isAlive: true }, { isAlive: true }];
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const wrapper = renderComponent({ listModelsWithInfo });
    assert.equal(wrapper.find('EnvList').length, 0);
    wrapper.find('.env-switcher__chevron').simulate('click', {
      preventDefault: () => null
    });
    const envList = wrapper.find('EnvList');
    assert.equal(envList.length, 1);
    assert.equal(envList.prop('environmentName'), 'MyEnv');
    assert.deepEqual(envList.prop('envs'), models);
  });

  it('fetches a list of environments on mount', () => {
    const listModelsWithInfo = sinon.stub();
    const wrapper = renderComponent({ listModelsWithInfo });
    const instance = wrapper.instance();
    assert.equal(listModelsWithInfo.callCount, 1);
    const err = null;
    const models = [
      {name: 'model1', isAlive: true},
      {name: 'model1', isAlive: false}
    ];
    listModelsWithInfo.args[0][0](err, models);
    assert.deepEqual(instance.state.envList, [models[0]]);
  });

  it('fetches the env list when opening', () => {
    const listModelsWithInfo = sinon.stub();
    const wrapper = renderComponent({ listModelsWithInfo });
    const instance = wrapper.instance();
    // Click the toggler
    wrapper.find('.env-switcher__chevron').simulate('click', {
      preventDefault: () => null
    });
    // The listModelsWithInfo should be called on componentDidMount and the
    // click.
    assert.equal(listModelsWithInfo.callCount, 2);
    const err = null;
    const models = [{name: 'm1', isAlive: true}];
    listModelsWithInfo.args[0][0](err, models);
    assert.deepEqual(instance.state.envList, models);
  });

  it('can call to switch models', () => {
    // To switch environments you click on an environment list item in a sub
    // component so here we're just going to call the method that gets
    // passed down.
    const models = [{
      uuid: 'abc123',
      name: 'Tardis',
      owner: 'The Dr.',
      password: 'buffalo',
      isAlive: true
    }];
    const listModelsWithInfo = sinon.stub();
    const switchModel = sinon.stub();
    const wrapper = renderComponent({ listModelsWithInfo, switchModel });
    const instance = wrapper.instance();
    listModelsWithInfo.args[0][0](null, models);
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
    const listModelsWithInfo = sinon.stub().callsArgWith(0, 'Uh oh!', null);
    renderComponent({ listModelsWithInfo, addNotification });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'unable to retrieve model list',
      message: 'unable to retrieve model list: Uh oh!',
      level: 'error'
    });
  });
});
