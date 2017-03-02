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
          displayType={'text'}
          loginToController={sinon.stub()} />);
    const expected = <div className="usso-login">
        <a className={'logout-link usso-login__action'}
           onClick={output.props.children[0].props.onClick}
           target="_blank">
          Login
        </a>
        <div className="usso-login__notification">
          {notification}
        </div>
      </div>;
    assert.deepEqual(output, expected);
  });

  it('calls loginToController on click for text link', () => {
    const loginToController = sinon.stub();
    const output = testUtils.renderIntoDocument(
        <juju.components.USSOLoginLink
          displayType={'text'}
          loginToController={loginToController} />, true);
    testUtils.Simulate.click(
      testUtils.findRenderedDOMComponentWithTag(output, 'a'));
    assert.equal(loginToController.callCount, 1);
  });

  it('can render a button link', () => {
    const component = jsTestUtils.shallowRender(
        <juju.components.USSOLoginLink
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
    assert.deepEqual(output, expected);
  });

  it('can render a button link with custom content', () => {
    const component = jsTestUtils.shallowRender(
        <juju.components.USSOLoginLink
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
          displayType={'button'}
          loginToController={loginToController} />, true);
    testUtils.Simulate.click(
      testUtils.findRenderedDOMComponentWithTag(output, 'button'));
    assert.equal(loginToController.callCount, 1);
  });


  it('does a postback to a URL in gisf', function() {
    const loginToController = sinon.stub().callsArg(0);
    const getDischargeToken = sinon.stub().returns('foo');
    const sendPost = sinon.stub();
    const callback = sinon.stub();
    const charmstore = sinon.stub();
    charmstore.bakery = sinon.stub();
    charmstore.bakery.fetchMacaroonFromStaticPath = sinon.stub();
    const output = testUtils.renderIntoDocument(
      <juju.components.USSOLoginLink
        callback={callback}
        charmstore={charmstore}
        displayType={'text'}
        gisf={true}
        getDischargeToken={getDischargeToken}
        loginToController={loginToController}
        sendPost={sendPost}
        storeUser={sinon.stub()}/>, true);
    testUtils.Simulate.click(
      testUtils.findRenderedDOMComponentWithTag(output, 'a'));
    assert.equal(sendPost.callCount, 1, 'Did not postback');
    assert.equal(
      sendPost.calledWith(
        '/_login',
        {'Content-Type': 'application/x-www-form-urlencoded'},
        'discharge-token=foo'), true,
      'sendPost not called with correct arguments');
    assert.equal(
      charmstore.bakery.fetchMacaroonFromStaticPath.callCount, 1,
      'Did not log in to chamstore');
  });
});
