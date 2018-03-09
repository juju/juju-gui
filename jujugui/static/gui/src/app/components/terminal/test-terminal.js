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
            <span onClick={sinon.stub()} role="button" tabIndex="0">
              <SvgIcon name="minimize-bar_16" size="16" />
            </span>
            <span onClick={sinon.stub()} role="button" tabIndex="0">
              <SvgIcon name="maximize-bar_16" size="16" />
            </span>
            <span onClick={sinon.stub()} role="button" tabIndex="0">
              <SvgIcon name="close_16" size="16" />
            </span>
          </div>
        </div>
        <div
          className={'juju-shell__terminal juju-shell__terminal--min'}
          ref="terminal"
          style={{}}>
        </div>
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
    assert.deepEqual(websocket.prototype.close.args[0], [1000]);
  });

  it('displays a welcome message when the session is ready', () => {
    checkWelcomeMessage({
      operation: 'start',
      code: 'ok',
      message: 'these are\nthe voyages\n\n'
    }, [
      ['connected to workspace'],
      ['these are'],
      ['the voyages']
    ]);
  });

  it('displays a welcome message when the session is ready (legacy)', () => {
    checkWelcomeMessage({
      code: 'ok',
      message: 'session is ready'
    }, [
      ['connected to workspace'],
      ['session is ready']
    ]);
  });

  it('does not display a welcome message if not present', () => {
    checkWelcomeMessage({
      operation: 'start',
      code: 'ok',
      message: ''
    }, [
      ['connected to workspace']
    ]);
  });

  // Check that a welcome message is written using term.writeln with the given
  // calls after receiving the given response from the server.
  function checkWelcomeMessage(response, expectedCalls) {
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
    const term = component.term;
    term.terminadoAttach = sinon.stub();
    term.writeln = sinon.stub();
    // Simulate that the server session is ready.
    component.ws.onmessage({data: JSON.stringify(response)});
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
    // The connection has bee hijacked.
    assert.equal(term.terminadoAttach.callCount, 1, 'terminadoAttach callCount');
    // The welcome message has been displayed.
    assert.equal(term.writeln.callCount, expectedCalls.length, 'writeln callCount');
    assert.deepEqual(term.writeln.args, expectedCalls);
  }

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
    // Check that fit is called after receiving the first PS1.
    component.term.fit = sinon.stub(); // eslint-disable-line
    // Send the setup from the term.
    component.ws.onmessage({data: '["setup", {}]'});
    // Send the initial PS1
    component.ws.onmessage({data: '["stdout", "my prompt $ "]'});
    assert.equal(component.term.fit.callCount, 1); // eslint-disable-line
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
    component.ws.onmessage({data: '["stdout", "another prompt ~$ "]'});
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
    assert.equal(websocket.prototype.send.callCount, 2);
    assert.deepEqual(websocket.prototype.send.args[0], ['["stdin","juju status\\n"]']);
    assert.deepEqual(websocket.prototype.send.args[1], ['["stdin","juju switch\\n"]']);
  });

  it('can be closed by clicking the X', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    // Set the ws onclose to something we control to be sure that it is reset.
    instance.ws = {
      onclose: sinon.stub()
    };
    // Call the onClick for the X
    output.props.children[0].props.children[1].props.children[2].props.onClick();
    assert.equal(instance.ws.onclose.callCount, 0);
    assert.deepEqual(instance.props.changeState.args[0], [{
      terminal: null
    }]);
  });

  it('handles unexpected WebSocket closures', () => {
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
    component.ws.onclose({
      // Should only throw the notification on code over 1000 which is an
      // expected closure.
      code: 1001
    });
    assert.deepEqual(component.props.addNotification.args[0], [{
      title: 'Terminal connection unexpectedly closed.',
      message: 'Terminal connection unexpectedly closed.',
      level: 'error'
    }]);
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
  });

  it('can be resized by clicking the two resize buttons', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const textarea = {focus: sinon.stub().withArgs()};
    instance.refs = {terminal: {
      querySelector: sinon.stub().withArgs('textarea').returns(textarea)
    }};
    instance.term = {fit: sinon.stub()}; // eslint-disable-line
    // Call the onClick for the maximize
    output.props.children[0].props.children[1].props.children[1].props.onClick();
    assert.equal(instance.state.size, 'max');
    // The focus has been moved back to the terminal.
    assert.strictEqual(textarea.focus.called, true, 'focus not called');
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
