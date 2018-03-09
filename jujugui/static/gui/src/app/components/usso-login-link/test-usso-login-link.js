/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const USSOLoginLink = require('./usso-login-link');
const GenericButton = require('../generic-button/generic-button');

const jsTestUtils = require('../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('USSOLoginLink', () => {
  it('can render a text link', () => {
    const output = jsTestUtils.shallowRender(
      <USSOLoginLink
        addNotification={sinon.stub()}
        displayType={'text'}
        loginToController={sinon.stub()} />);
    const expected = (
      <div className="usso-login">
        <a className="usso-login__action"
          onClick={output.props.children.props.onClick}
          target="_blank">
            Login
        </a>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('calls loginToController on click for text link', () => {
    const loginToController = sinon.stub();
    const output = testUtils.renderIntoDocument(
      <USSOLoginLink
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
      <USSOLoginLink
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
      <USSOLoginLink
        addNotification={sinon.stub()}
        displayType={'button'}
        gisf={false}
        loginToController={sinon.stub()}
        sendPost={sinon.stub()} />, true);
    const output = component.getRenderOutput();
    var expected = (
      <div className="usso-login">
        <GenericButton
          action={component.getMountedInstance().handleLogin}
          extraClasses="usso-login__action"
          type="positive" >
          Sign up/Log in with USSO
        </GenericButton>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render a button link with custom content', () => {
    const component = jsTestUtils.shallowRender(
      <USSOLoginLink
        addNotification={sinon.stub()}
        displayType={'button'}
        gisf={false}
        loginToController={sinon.stub()}
        sendPost={sinon.stub()}>
          Scooby Doo
      </USSOLoginLink>, true);
    const output = component.getRenderOutput();
    assert.equal(output.props.children.props.children, 'Scooby Doo');
  });

  it('can render a text link with custom content', () => {
    const component = jsTestUtils.shallowRender(
      <USSOLoginLink
        addNotification={sinon.stub()}
        displayType={'text'}
        gisf={false}
        loginToController={sinon.stub()}
        sendPost={sinon.stub()}>
          Scooby Doo
      </USSOLoginLink>, true);
    const output = component.getRenderOutput();
    assert.equal(output.props.children.props.children, 'Scooby Doo');
  });

  it('calls loginToController on click for button link', () => {
    const loginToController = sinon.stub();
    const output = testUtils.renderIntoDocument(
      <USSOLoginLink
        addNotification={sinon.stub()}
        displayType={'button'}
        loginToController={loginToController} />, true);
    testUtils.Simulate.click(
      testUtils.findRenderedDOMComponentWithTag(output, 'button'));
    assert.equal(loginToController.callCount, 1);
  });
});
