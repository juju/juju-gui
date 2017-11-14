/* Copyright (c) 2017 Canonical Ltd */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const ReactTestUtils = require('react-dom/test-utils');

const SvgIcon = require('../svg-icon/svg-icon');
const Terminal = require('./terminal');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Terminal', () => {

  let websocket;

  function setupWebsocket() {
    websocket = function() {};
    websocket.prototype.send = sinon.stub();
    websocket.prototype.close = sinon.stub();
  }

  function renderComponent(options = {}) {
    setupWebsocket();

    return jsTestUtils.shallowRender(
      <Terminal
        addNotification={sinon.stub()}
        address="1.2.3.4:123"
        changeState={sinon.stub()}
        commands={options.commands}
        creds={{
          user: 'user',
          password: 'password',
          macaroons: {}
        }}
        WebSocket={websocket} />, true);
  };

  it('should render', () => {
    const expected = (
      <div className="juju-shell">
        <div className="juju-shell__header">
          <span className="juju-shell__header-label">Juju Shell</span>
          <div className="juju-shell__header-actions">
            <span onClick={sinon.stub()} tabIndex="0" role="button">
              <SvgIcon name="minimize-bar_16" size="16" />
            </span>
            <span onClick={sinon.stub()} tabIndex="0" role="button">
              <SvgIcon name="maximize-bar_16" size="16" />
            </span>
            <span onClick={sinon.stub()} tabIndex="0" role="button">
              <SvgIcon name="close_16" size="16" />
            </span>
          </div>
        </div>
        <div className={'juju-shell__terminal juju-shell__terminal--min'} style={{}}></div>
      </div>);
    expect(renderComponent().getRenderOutput()).toEqualJSX(expected);
  });

  it('instantiates the terminal and connects to the websocket on mount', () => {
    setupWebsocket();
    const component = ReactTestUtils.renderIntoDocument(
      <Terminal
        addNotification={sinon.stub()}
        address="1.2.3.4:123"
        changeState={sinon.stub()}
        creds={{
          user: 'user',
          password: 'password',
          macaroons: {}
        }}
        WebSocket={websocket} />
    );
    assert.equal(component.ws instanceof websocket, true);
    assert.equal(typeof component.term, 'object');
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
    assert.equal(websocket.prototype.close.callCount, 1);
  });

  it('sends supplied commands when it is set up', () => {
    setupWebsocket();
    const component = ReactTestUtils.renderIntoDocument(
      <Terminal
        addNotification={sinon.stub()}
        address="1.2.3.4:123"
        changeState={sinon.stub()}
        commands={['juju status']}
        creds={{
          user: 'user',
          password: 'password',
          macaroons: {}
        }}
        WebSocket={websocket} />
    );
    // Send the setup from the term.
    component.ws.onmessage({data: '["setup", {}]'});
    // Send the initial PS1
    component.ws.onmessage({data: '["stdout", "\\u001b[01;32"]'});
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
    assert.equal(websocket.prototype.send.callCount, 1);
    assert.deepEqual(websocket.prototype.send.args[0], ['["stdin","juju status\\n"]']);
  });

  it('sends multiple commands when it is set up', () => {
    setupWebsocket();
    const component = ReactTestUtils.renderIntoDocument(
      <Terminal
        addNotification={sinon.stub()}
        address="1.2.3.4:123"
        changeState={sinon.stub()}
        commands={['juju status', 'juju switch']}
        creds={{
          user: 'user',
          password: 'password',
          macaroons: {}
        }}
        WebSocket={websocket} />
    );
    // Send the setup from the term.
    component.ws.onmessage({data: '["setup", {}]'});
    // Send the initial PS1
    component.ws.onmessage({data: '["stdout", "\\u001b[01;32"]'});
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
    assert.equal(websocket.prototype.send.callCount, 2);
    assert.deepEqual(websocket.prototype.send.args[0], ['["stdin","juju status\\n"]']);
    assert.deepEqual(websocket.prototype.send.args[1], ['["stdin","juju switch\\n"]']);
  });

  it('can be closed by clicking the X', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    // Call the onClick for the X
    output.props.children[0].props.children[1].props.children[2].props.onClick();
    assert.deepEqual(instance.props.changeState.args[0], [{
      terminal: null
    }]);
  });

  it('can be resized by clicking the two resize buttons', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    // Call the onClick for the maximize
    output.props.children[0].props.children[1].props.children[1].props.onClick();
    assert.equal(instance.state.size, 'max');
    const output2 = renderer.getRenderOutput();
    // Check that the styles have been updated for max height.
    // Because the browser dimensions can vary across machines this just checks
    // that the height was indeed set.
    const termElement = output2.props.children[1];
    const heightStyle = termElement.props.style.height;
    assert.equal(termElement.props.className, 'juju-shell__terminal');
    assert.equal(heightStyle.indexOf('px') !== -1, true);
    assert.equal(parseInt(heightStyle.split('px')[0], 10) > 100, true);
    // Call the onclick for the minimize
    output.props.children[0].props.children[1].props.children[0].props.onClick();
    assert.equal(instance.state.size, 'min');
    const output3 = renderer.getRenderOutput();
    const termElement2 = output3.props.children[1];
    assert.equal(
      termElement2.props.className, 'juju-shell__terminal juju-shell__terminal--min');
    assert.deepEqual(termElement2.props.style, {});
  });

});
