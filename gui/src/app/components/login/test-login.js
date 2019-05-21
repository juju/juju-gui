/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Analytics = require('../../../test/fake-analytics');
const Login = require('./login');

describe('LoginComponent', function() {

  const renderComponent = (options = {}) => {
    const wrapper = enzyme.shallow(
      <Login
        addNotification={options.addNotification || sinon.stub()}
        analytics={Analytics}
        bakeryEnabled={!!options.bakeryEnabled}
        controllerIsConnected={options.controllerIsConnected || sinon.stub()}
        errorMessage={options.errorMessage}
        gisf={options.gisf === undefined ? false : options.gisf}
        loginToAPIs={options.loginToAPIs || sinon.stub()}
        loginToController={options.loginToController || sinon.stub()} />,
      {disableLifecycleMethods: true}
    );
    const instance = wrapper.instance();
    instance.refs = {
      username: {
        focus: sinon.stub()
      },
      USSOLoginLink: {
        handleLogin: sinon.stub()
      }
    };
    instance.componentDidMount();
    return wrapper;
  };

  afterEach(function() {
    // Clear any timeouts created when rendering the component.
    let id = window.setTimeout(function() {}, 0);
    while (id--) {
      window.clearTimeout(id);
    }
  });

  it('renders', function() {
    const wrapper = renderComponent({bakeryEnabled: true});
    expect(wrapper).toMatchSnapshot();
  });

  it('renders without the USSO login button', function() {
    const wrapper = renderComponent({bakeryEnabled: false});
    assert.equal(wrapper.find('USSOLoginLink').length, 0);
  });

  it('renders but is hidden in gisf', function() {
    const wrapper = renderComponent({gisf: true});
    assert.equal(wrapper.prop('className').includes('hidden'), true);
  });

  it('can display a login error message', function() {
    const wrapper = renderComponent({errorMessage: 'bad wolf'});
    assert.equal(wrapper.find('.login__failure-message').text(), 'bad wolf');
  });

  it('calls to log the user in on submit', function() {
    var loginToAPIs = sinon.stub();
    const wrapper = renderComponent({loginToAPIs});
    const instance = wrapper.instance();
    instance.refs.username = {value: 'foo'};
    instance.refs.password = {value: 'bar'};
    wrapper.find('form').simulate('submit');
    assert.equal(loginToAPIs.callCount, 1, 'loginToAPIs never called');
    assert.deepEqual(loginToAPIs.args[0], [{
      user: 'foo',
      password: 'bar'
    }, false]);
  });

  it('automatically logs in for gisf via usso', function() {
    const loginToController = sinon.stub().callsArg(0);
    const controllerIsConnected = sinon.stub().returns(true);
    const wrapper = renderComponent({
      controllerIsConnected,
      gisf: true,
      loginToController
    });
    const instance = wrapper.instance();
    assert.equal(
      instance.refs.USSOLoginLink.handleLogin.callCount, 1, 'loginToController not called');
  });

  it('eventually fails auto login if controller does not connect', function() {
    var loginToController = sinon.stub();
    var controllerIsConnected = sinon.stub().returns(false);
    const wrapper = renderComponent({
      controllerIsConnected,
      gisf: true,
      loginToController
    });
    const instance = wrapper.instance();
    assert.equal(
      instance.refs.USSOLoginLink.handleLogin.callCount, 0, 'loginToController not called');
  });

  it('can focus on the username field', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    assert.equal(instance.refs.username.focus.callCount, 1);
  });
});
