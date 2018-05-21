/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Login = require('./login');
const SvgIcon = require('../svg-icon/svg-icon');
const GenericButton = require('../generic-button/generic-button');
const USSOLoginLink = require('../usso-login-link/usso-login-link');

describe('LoginComponent', function() {

  const renderComponent = (options = {}) => {
    const wrapper = enzyme.shallow(
      <Login
        addNotification={options.addNotification || sinon.stub()}
        bakeryEnabled={!!options.bakeryEnabled}
        controllerIsConnected={options.controllerIsConnected || sinon.stub()}
        errorMessage={options.errorMessage}
        gisf={options.gisf === undefined ? false : options.gisf}
        loginToAPIs={options.loginToAPIs || sinon.stub()}
        loginToController={options.loginToController || sinon.stub()} />,
      { disableLifecycleMethods: true }
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
    var expected = (
      <div className="login">
        <div className="login__logo">
          <SvgIcon height="30" name="juju-logo" width="75" />
        </div>
        <div className="login__full-form">
          <div className="login__env-name">
            Login
          </div>
          {undefined}
          <form
            className="login__form"
            onSubmit={wrapper.find('form').prop('onSubmit')}
            ref="form">
            <label
              className="login__label">
              Username
              <input
                className="login__input"
                name="username"
                ref="username"
                type="text" />
            </label>
            <label
              className="login__label">
              Password
              <input
                className="login__input"
                name="password"
                ref="password"
                type="password" />
            </label>
            <GenericButton
              submit={true}
              type="positive">
              Login
            </GenericButton>
            <USSOLoginLink
              addNotification={sinon.stub()}
              displayType="button"
              loginToController={sinon.stub()}
              ref="USSOLoginLink" />
          </form>
        </div>
        <div className="login__message">
          <p>
            Find your username and password with<br />
            <code>juju show-controller --show-password</code>
          </p>
          <div className="login__message-link">
            <a href="https://jujucharms.com" target="_blank">
              jujucharms.com
            </a>
          </div>
        </div>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('renders without the USSO login button', function() {
    const wrapper = renderComponent({bakeryEnabled: false});
    var expected = (
      <div className="login">
        <div className="login__logo">
          <SvgIcon height="30" name="juju-logo" width="75" />
        </div>
        <div className="login__full-form">
          <div className="login__env-name">
            Login
          </div>
          {undefined}
          <form
            className="login__form"
            onSubmit={wrapper.find('form').prop('onSubmit')}
            ref="form">
            <label
              className="login__label">
              Username
              <input
                className="login__input"
                name="username"
                ref="username"
                type="text" />
            </label>
            <label
              className="login__label">
              Password
              <input
                className="login__input"
                name="password"
                ref="password"
                type="password" />
            </label>
            <GenericButton
              submit={true}
              type="positive">
              Login
            </GenericButton>
          </form>
        </div>
        <div className="login__message">
          <p>
            Find your username and password with<br />
            <code>juju show-controller --show-password</code>
          </p>
          <div className="login__message-link">
            <a href="https://jujucharms.com" target="_blank">
              jujucharms.com
            </a>
          </div>
        </div>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('renders but is hidden in gisf', function() {
    const wrapper = renderComponent({ gisf: true });
    assert.equal(wrapper.prop('className').includes('hidden'), true);
  });

  it('can display a login error message', function() {
    const wrapper = renderComponent({ errorMessage: 'bad wolf' });
    assert.equal(wrapper.find('.login__failure-message').text(), 'bad wolf');
  });

  it('calls to log the user in on submit', function() {
    var loginToAPIs = sinon.stub();
    const wrapper = renderComponent({ loginToAPIs });
    const instance = wrapper.instance();
    instance.refs.username = { value: 'foo' };
    instance.refs.password = { value: 'bar' };
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
