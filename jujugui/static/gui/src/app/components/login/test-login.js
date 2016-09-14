/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('LoginComponent', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('login-component', function() { done(); });
  });

  it('renders', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Login
        isLegacyJuju={false}
        loginToAPIs={sinon.stub()}/>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="login">
        <div className="login__logo">
          <juju.components.SvgIcon width="75" height="30" name="juju-logo" />
        </div>
        <div className="login__full-form">
          <div className="login__env-name">
            Login
          </div>
          {undefined}
          <form
            className="login__form"
            ref="form"
            onSubmit={instance._handleLoginSubmit}>
            <label
              className="login__label">
              Username
              <input
                className="login__input"
                type="text"
                name="username"
                ref="username" />
            </label>
            <label
              className="login__label">
              Password
              <input
                className="login__input"
                type="password"
                name="password"
                ref="password" />
            </label>
            <juju.components.ButtonRow
              buttons={[{
                submit: true,
                title: 'Login',
                type: 'positive'
              }, {
                action: instance._handleLoginWithMacaroonSubmit,
                title: 'Login with USSO',
                type: 'neutral'
              }]} />
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
    assert.deepEqual(output, expected);
  });

  it('renders for legacy Juju', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Login
        isLegacyJuju={true}
        loginToAPIs={sinon.stub()}/>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="login">
        <div className="login__logo">
          <juju.components.SvgIcon width="75" height="30" name="juju-logo" />
        </div>
        <div className="login__full-form">
          <div className="login__env-name">
            Login
          </div>
          {undefined}
          <form
            className="login__form"
            ref="form"
            onSubmit={instance._handleLoginSubmit}>
            <label
              className="login__label">
              Username
              <input
                className="login__input"
                type="text"
                name="username"
                ref="username" />
            </label>
            <label
              className="login__label">
              Password
              <input
                className="login__input"
                type="password"
                name="password"
                ref="password" />
            </label>
            <juju.components.ButtonRow
              buttons={[{
                submit: true,
                title: 'Login',
                type: 'positive'
              }]} />
          </form>
        </div>
        <div className="login__message">
          <p>
            Find your password with<br />
            <code>juju api-info --password password</code>
          </p>
          <div className="login__message-link">
            <a href="https://jujucharms.com" target="_blank">
              jujucharms.com
            </a>
          </div>
        </div>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('can display a login error message', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.Login
        errorMessage='bad wolf'
        isLegacyJuju={false}
        loginToAPIs={sinon.stub()}/>);
    var expected = <div className="login__failure-message">bad wolf</div>;
    assert.deepEqual(output.props.children[1].props.children[1], expected);
  });

  it('calls to log the user in on submit', function() {
    var loginToAPIs = sinon.stub();
    var component = testUtils.renderIntoDocument(
      <juju.components.Login
        isLegacyJuju={false}
        loginToAPIs={loginToAPIs}/>);
    component.refs.username.value = 'foo';
    component.refs.password.value = 'bar';

    testUtils.Simulate.submit(component.refs.form);

    assert.equal(loginToAPIs.callCount, 1, 'loginToAPIs never called');
    assert.deepEqual(loginToAPIs.args[0], [{
      user: 'foo',
      password: 'bar'
    }, false]);
  });

  it('calls to log the user in with USSO', function() {
    const loginToAPIs = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Login
        isLegacyJuju={false}
        loginToAPIs={loginToAPIs}/>, true);
    var output = renderer.getRenderOutput();
    var buttons = output.props.children[1].props.children[2].props.children[2];
    buttons.props.buttons[1].action();
    assert.equal(loginToAPIs.callCount, 1, 'loginToAPIs never called');
    assert.deepEqual(loginToAPIs.args[0], [null, true]);
  });

  it('can focus on the username field', function() {
    var focus = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Login
        isLegacyJuju={false}
        loginToAPIs={sinon.stub()}/>, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {username: {focus: focus}};
    instance.componentDidMount();
    assert.equal(focus.callCount, 1);
  });
});
