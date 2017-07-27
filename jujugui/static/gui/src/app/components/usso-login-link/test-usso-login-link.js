/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('USSOLoginLink', () => {

  const notification = `If requested,
        in the address bar above, please allow popups
        from ${window.location.origin}.`;

  beforeAll(done => {
    // By loading this file it adds the component to the juju components.
    YUI().use('usso-login-link', () => { done(); });
  });

  it('can render a text link', () => {
    const output = jsTestUtils.shallowRender(
      <juju.components.USSOLoginLink
        addNotification={sinon.stub()}
        displayType={'text'}
        loginToController={sinon.stub()} />);
    const expected = <div className="usso-login">
      <a className="usso-login__action"
        onClick={output.props.children[0].props.onClick}
        target="_blank">
          Login
      </a>
      <div className="usso-login__notification">
        {notification}
      </div>
    </div>;
    expect(output).toEqualJSX(expected);
  });

  it('calls loginToController on click for text link', () => {
    const loginToController = sinon.stub();
    const output = testUtils.renderIntoDocument(
      <juju.components.USSOLoginLink
        addNotification={sinon.stub()}
        displayType={'text'}
        loginToController={loginToController} />, true);
    testUtils.Simulate.click(
      testUtils.findRenderedDOMComponentWithTag(output, 'a'));
    assert.equal(loginToController.callCount, 1);
  });

  it('handles errors when logging in', () => {
    const addNotification = sinon.stub();
    const loginToController = sinon.stub().callsArgWith(0, 'Uh oh!');
    const output = testUtils.renderIntoDocument(
      <juju.components.USSOLoginLink
        addNotification={addNotification}
        displayType={'text'}
        loginToController={loginToController} />, true);
    testUtils.Simulate.click(
      testUtils.findRenderedDOMComponentWithTag(output, 'a'));
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'cannot log into the controller',
      message: 'cannot log into the controller: Uh oh!',
      level: 'error'
    });
  });

  it('can render a button link', () => {
    const component = jsTestUtils.shallowRender(
      <juju.components.USSOLoginLink
        addNotification={sinon.stub()}
        displayType={'button'}
        loginToController={sinon.stub()}
        sendPost={sinon.stub()}
        gisf={false}/>, true);
    const output = component.getRenderOutput();
    var expected = (
      <div className="usso-login">
        <juju.components.GenericButton
          action={component.getMountedInstance().handleLogin}
          extraClasses="usso-login__action"
          type="positive" >
          Sign up/Log in with USSO
        </juju.components.GenericButton>
        <div className="usso-login__notification">
          {notification}
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render a button link with custom content', () => {
    const component = jsTestUtils.shallowRender(
      <juju.components.USSOLoginLink
        addNotification={sinon.stub()}
        displayType={'button'}
        loginToController={sinon.stub()}
        sendPost={sinon.stub()}
        gisf={false}>
          Scooby Doo
      </juju.components.USSOLoginLink>, true);
    const output = component.getRenderOutput();
    assert.equal(output.props.children[0].props.children, 'Scooby Doo');
  });

  it('can render a text link with custom content', () => {
    const component = jsTestUtils.shallowRender(
      <juju.components.USSOLoginLink
        addNotification={sinon.stub()}
        displayType={'text'}
        loginToController={sinon.stub()}
        sendPost={sinon.stub()}
        gisf={false}>
          Scooby Doo
      </juju.components.USSOLoginLink>, true);
    const output = component.getRenderOutput();
    assert.equal(output.props.children[0].props.children, 'Scooby Doo');
  });

  it('calls loginToController on click for button link', () => {
    const loginToController = sinon.stub();
    const output = testUtils.renderIntoDocument(
      <juju.components.USSOLoginLink
        addNotification={sinon.stub()}
        displayType={'button'}
        loginToController={loginToController} />, true);
    testUtils.Simulate.click(
      testUtils.findRenderedDOMComponentWithTag(output, 'button'));
    assert.equal(loginToController.callCount, 1);
  });
});
