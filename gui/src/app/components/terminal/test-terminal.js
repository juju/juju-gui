/* Copyright (c) 2017 Canonical Ltd */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const SvgIcon = require('../svg-icon/svg-icon');
const Terminal = require('./terminal');

describe('Terminal', () => {
  let websocket, wrapper;

  function setupWebsocket() {
    websocket = function() {};
    websocket.prototype.send = sinon.stub();
    websocket.prototype.close = sinon.stub();
  }

  const renderComponent = (options = {}) => {
    wrapper = enzyme.shallow(
      <Terminal
        addNotification={options.addNotification || sinon.stub()}
        address={options.address || '1.2.3.4:123'}
        changeState={options.changeState || sinon.stub()}
        commands={options.commands}
        creds={options.creds || {
          user: 'user',
          password: 'password',
          macaroons: {}
        }}
        WebSocket={options.websocket || websocket} />,
      {disableLifeCycleMethods: true}
    );
    const instance = wrapper.instance();
    instance.refs = {
      terminal: {
        querySelector: sinon.stub().returns({focus: sinon.stub()})
      }
    };
    return wrapper;
  };

  beforeEach(() => {
    setupWebsocket();
  });

  afterEach(() => {
    // Have to manually unmount the component as disableLifeCycleMethods is set
    // when the component is rendered.
    wrapper.unmount();
    wrapper = null;
  });

  it('should render', () => {
    wrapper = renderComponent();
    const actions = wrapper.find('.juju-shell__header-actions span');
    const expected = (
      <div className="juju-shell">
        <div className="juju-shell__header">
          <span className="juju-shell__header-label">Juju Shell</span>
          <div className="juju-shell__header-actions">
            <span
              onClick={actions.at(0).prop('onClick')}
              role="button"
              tabIndex="0">
              <SvgIcon name="minimize-bar_16" size="16" />
            </span>
            <span
              onClick={actions.at(1).prop('onClick')}
              role="button"
              tabIndex="0">
              <SvgIcon name="maximize-bar_16" size="16" />
            </span>
            <span
              onClick={actions.at(2).prop('onClick')}
              role="button"
              tabIndex="0">
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
    assert.compareJSX(wrapper, expected);
  });

  it('instantiates the terminal and connects to the websocket on mount', () => {
    wrapper = renderComponent();
    const instance = wrapper.instance();
    assert.equal(instance.ws instanceof websocket, true);
    assert.equal(typeof instance.term, 'object');
    wrapper.unmount();
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
    wrapper = renderComponent();
    const instance = wrapper.instance();
    const term = instance.term;
    instance.term.fit = sinon.stub(); // eslint-disable-line
    term.terminadoAttach = sinon.stub();
    term.writeln = sinon.stub();
    // Simulate that the server session is ready.
    instance.ws.onmessage({data: JSON.stringify(response)});
    wrapper.unmount();
    // The connection has been hijacked.
    assert.equal(term.terminadoAttach.callCount, 1, 'terminadoAttach callCount');
    // The welcome message has been displayed.
    assert.equal(term.writeln.callCount, expectedCalls.length, 'writeln callCount');
    assert.deepEqual(term.writeln.args, expectedCalls);
  }

  it('sends supplied commands when it is set up', () => {
    wrapper = renderComponent({commands: ['juju status']});
    const instance = wrapper.instance();
    // Check that fit is called after receiving the first PS1.
    instance.term.fit = sinon.stub(); // eslint-disable-line
    // Send the setup from the term.
    instance.ws.onmessage({data: '["setup", {}]'});
    // Send the initial PS1
    instance.ws.onmessage({data: '["stdout", "my prompt $ "]'});
    assert.equal(instance.term.fit.callCount, 1); // eslint-disable-line
    wrapper.unmount();
    assert.equal(websocket.prototype.send.callCount, 1);
    assert.deepEqual(websocket.prototype.send.args[0], ['["stdin","juju status\\n"]']);
  });

  it('sends multiple commands when it is set up', () => {
    wrapper = renderComponent({commands: ['juju status', 'juju switch']});
    const instance = wrapper.instance();
    instance.term.fit = sinon.stub(); // eslint-disable-line
    // Send the setup from the term.
    instance.ws.onmessage({data: '["setup", {}]'});
    // Send the initial PS1
    instance.ws.onmessage({data: '["stdout", "another prompt ~$ "]'});
    wrapper.unmount();
    assert.equal(websocket.prototype.send.callCount, 2);
    assert.deepEqual(websocket.prototype.send.args[0], ['["stdin","juju status\\n"]']);
    assert.deepEqual(websocket.prototype.send.args[1], ['["stdin","juju switch\\n"]']);
  });

  it('can be closed by clicking the X', () => {
    wrapper = renderComponent();
    const instance = wrapper.instance();
    // Set the ws onclose to something we control to be sure that it is reset.
    instance.ws.onclose = sinon.stub();
    // Call the onClick for the X
    wrapper.find('.juju-shell__header-actions span').at(2).simulate('click');
    assert.equal(instance.ws.onclose.callCount, 0);
    assert.deepEqual(instance.props.changeState.args[0], [{
      terminal: null
    }]);
  });

  it('handles unexpected WebSocket closures', () => {
    const addNotification = sinon.stub();
    wrapper = renderComponent({addNotification});
    const instance = wrapper.instance();
    instance.ws.onclose({
      // Should only throw the notification on code over 1000 which is an
      // expected closure.
      code: 1001
    });
    assert.deepEqual(addNotification.args[0], [{
      title: 'Terminal connection unexpectedly closed.',
      message: 'Terminal connection unexpectedly closed.',
      level: 'error'
    }]);
  });

  it('can be resized by clicking the two resize buttons', () => {
    wrapper = renderComponent();
    const instance = wrapper.instance();
    const textarea = {focus: sinon.stub().withArgs()};
    instance.refs = {terminal: {
      querySelector: sinon.stub().withArgs('textarea').returns(textarea)
    }};
    instance.term.fit = sinon.stub(); // eslint-disable-line
    // Call the onClick for the maximize
    wrapper.find('.juju-shell__header-actions span').at(1).simulate('click');
    assert.equal(instance.state.size, 'max');
    // The focus has been moved back to the terminal.
    assert.strictEqual(textarea.focus.called, true, 'focus not called');
    wrapper.update();
    // Check that the styles have been updated for max height.
    // Because the browser dimensions can vary across machines this just checks
    // that the height was indeed set.
    const termElement = wrapper.find('.juju-shell__terminal');
    const heightStyle = termElement.prop('style').height;
    assert.equal(
      termElement.prop('className').includes('juju-shell__terminal--min'),
      false);
    assert.equal(heightStyle.indexOf('px') !== -1, true);
    assert.equal(parseInt(heightStyle.split('px')[0], 10) > 100, true);
    // Call the onclick for the minimize
    wrapper.find('.juju-shell__header-actions span').at(0).simulate('click');
    assert.equal(instance.state.size, 'min');
    wrapper.update();
    const termElement2 = wrapper.find('.juju-shell__terminal');
    assert.equal(
      termElement2.prop('className').includes('juju-shell__terminal--min'),
      true);
    assert.deepEqual(termElement2.prop('style'), {});
  });

});
