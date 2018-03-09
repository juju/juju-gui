/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Login = require('./login');
const SvgIcon = require('../svg-icon/svg-icon');
const GenericButton = require('../generic-button/generic-button');
const USSOLoginLink = require('../usso-login-link/usso-login-link');

const jsTestUtils = require('../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('LoginComponent', function() {

  afterEach(function() {
    // Clear any timeouts created when rendering the component.
    let id = window.setTimeout(function() {}, 0);
    while (id--) {
      window.clearTimeout(id);
    }
  });

  it('renders', function() {
    const addNotification = sinon.stub();
    const loginToControllerStub = sinon.stub();
    const controllerIsConnected = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <Login
        addNotification={addNotification}
        controllerIsConnected={controllerIsConnected}
        gisf={false}
        loginToAPIs={sinon.stub()}
        loginToController={loginToControllerStub} />,
      true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
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
            onSubmit={instance._handleLoginSubmit}
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
              addNotification={addNotification}
              displayType="button"
              loginToController={loginToControllerStub}
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
    expect(output).toEqualJSX(expected);
  });

  it('renders but is hidden in gisf', function() {
    const addNotification = sinon.stub();
    const loginToControllerStub = sinon.stub();
    const controllerIsConnected = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <Login
        addNotification={addNotification}
        controllerIsConnected={controllerIsConnected}
        gisf={true}
        loginToAPIs={sinon.stub()}
        loginToController={loginToControllerStub} />,
      true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="login hidden">
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
            onSubmit={instance._handleLoginSubmit}
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
              addNotification={addNotification}
              displayType="button"
              loginToController={loginToControllerStub}
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
    expect(output).toEqualJSX(expected);
  });

  it('can display a login error message', function() {
    var output = jsTestUtils.shallowRender(
      <Login
        addNotification={sinon.stub()}
        controllerIsConnected={sinon.stub()}
        errorMessage='bad wolf'
        gisf={false}
        loginToAPIs={sinon.stub()}
        loginToController={sinon.stub()} />);
    var expected = <div className="login__failure-message">bad wolf</div>;
    assert.deepEqual(output.props.children[1].props.children[1], expected);
  });

  it('calls to log the user in on submit', function() {
    var loginToAPIs = sinon.stub();
    var component = testUtils.renderIntoDocument(
      <Login
        addNotification={sinon.stub()}
        controllerIsConnected={sinon.stub()}
        gisf={false}
        loginToAPIs={loginToAPIs}
        loginToController={sinon.stub()} />);
    component.refs.username.value = 'foo';
    component.refs.password.value = 'bar';

    testUtils.Simulate.submit(component.refs.form);

    assert.equal(loginToAPIs.callCount, 1, 'loginToAPIs never called');
    assert.deepEqual(loginToAPIs.args[0], [{
      user: 'foo',
      password: 'bar'
    }, false]);
  });

  it('automatically logs in for gisf via usso', function() {
    const loginToController = sinon.stub().callsArg(0);
    const controllerIsConnected = sinon.stub().returns(true);
    testUtils.renderIntoDocument(
      <Login
        addNotification={sinon.stub()}
        controllerIsConnected={controllerIsConnected}
        gisf={true}
        loginToAPIs={sinon.stub()}
        loginToController={loginToController} />);
    assert.equal(
      loginToController.callCount, 1, 'loginToController not called');
  });

  it('eventually fails auto login if controller does not connect', function() {
    var loginToController = sinon.stub();
    var controllerIsConnected = sinon.stub().returns(false);
    testUtils.renderIntoDocument(
      <Login
        addNotification={sinon.stub()}
        controllerIsConnected={controllerIsConnected}
        gisf={true}
        loginToAPIs={sinon.stub()}
        loginToController={loginToController} />);
    assert.equal(
      loginToController.callCount, 0, 'loginToController not called');
  });

  it('can focus on the username field', function() {
    var focus = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <Login
        addNotification={sinon.stub()}
        controllerIsConnected={sinon.stub()}
        gisf={false}
        loginToAPIs={sinon.stub()}
        loginToController={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {username: {focus: focus}};
    instance.componentDidMount();
    assert.equal(focus.callCount, 1);
  });
});
