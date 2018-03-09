/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classnames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');
const ReactDOM = require('react-dom');
const shapeup = require('shapeup');
const XTerm = require('xterm');

const SvgIcon = require('../svg-icon/svg-icon');

// xterm.js loads plugins by requiring them. This changes the prototype of the
// xterm object. This is inherently dirty, but not really up to us, and perhaps
// not something we can change.
require('xterm/lib/addons/terminado/terminado');
require('xterm/lib/addons/fit/fit');

/** Terminal component used to display the Juju shell. */
class Terminal extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      size: 'min',
      // The terminalSize will be set to the window height subtract some
      // value, that will be set here and used to determine the height
      // of the terminal.
      terminalSize: null
    };
    this.term = null;
    this.ws = null;
    this.terminalSetup;
    this.initialCommandsSent = false;
    this.resizeTimeout = null;
    this._boundThrottledResize = null;
  }

  /**
    Set up the terminal WebSocket connection, including handling of initial
    handlshake and then attaching the xterm.js session.
  */
  componentDidMount() {
    const props = this.props;
    const term = new XTerm();
    term.writeln('connecting (this operation could take a minute)... ');
    this.term = term;
    term.open(
      ReactDOM.findDOMNode(this).querySelector('.juju-shell__terminal'),
      true);
    const ws = new props.WebSocket(props.address);
    this.ws = ws;
    const creds = props.creds;
    ws.onopen = () => {
      ws.send(JSON.stringify({
        operation: OP_LOGIN,
        username: creds.user,
        password: creds.password,
        macaroons: creds.macaroons
      }));
      ws.send(JSON.stringify({operation: OP_START}));
    };
    ws.onerror = err => {
      console.error('WebSocket error:', err);
      props.addNotification({
        title: 'WebSocket connection failed',
        message: 'Failed to open WebSocket connection',
        level: 'error'
      });
    };
    ws.onmessage = evt => {
      const resp = JSON.parse(evt.data);
      if (resp.code === CODE_ERR) {
        console.error(resp.message);
        props.addNotification({
          title: 'Error talking to the terminal server',
          message: 'Error talking to the terminal server: ' + resp.message,
          level: 'error'
        });
        return;
      }
      switch(resp[0]) {
        case 'disconnect':
          // Terminado sends a "disconnect" message when the process it's
          // running exits. When we receive that, we close the terminal.
          // We also have to overwrite the onclose method because the WebSocket
          // isn't properly terminated by terminado and instead a 1006 close
          // code is generated triggering the error notification.
          this.ws.onclose = () => {};
          this.close();
          break;
        case 'setup':
          // Terminado sends a "setup" message after it's fully done setting
          // up on the server side and will be sending the first PS1 to the
          // client.
          this.terminalSetup = true;
          break;
        case 'stdout':
          if (this.terminalSetup && !this.initialCommandsSent) {
            // If the first PS1 presented to the user changes then this will
            // need to be updated.
            const suffix = '$ ';
            if (resp[1].indexOf(suffix, resp[1].length-suffix.length) !== -1) {
              // Call to resize the terminal after getting the first PS1.
              term.fit();
              this.initialCommandsSent = true;
              const commands = props.commands;
              if (commands) {
                commands.forEach(
                  cmd => ws.send(JSON.stringify(['stdin', `${cmd}\n`])));
              }
            }
          }
      }
      if (resp.code === CODE_OK && (
        resp.message === 'session is ready' || // Legacy API.
        resp.operation === OP_START // New supported API.
      )) {
        term.terminadoAttach(ws);
        this._welcome(term, resp.message);
      }
    };
    ws.onclose = evt => {
      // 1000 is the code for a normal closure, anything above that is abnormal.
      if (evt && evt.code > 1000) {
        // It is not a normal closure so we should issue an error.
        const msg = 'Terminal connection unexpectedly closed.';
        term.writeln(msg + ' Close and re-open the terminal window to reconnect.');
        console.log(evt);
        props.addNotification({
          title: msg,
          message: msg,
          level: 'error'
        });
      }
    };

    this.attachResizeListener();
  }

  /**
    Write a welcome message to the given term instance.
    @param {Object} term The xterm instance.
    @param {String} message The optional response message from the server.
  */
  _welcome(term, message) {
    term.writeln('connected to workspace');
    const msg = message.replace(/\s+$/, '');
    // Split and write each line to avoid xterm weird text formatting.
    const lines = msg ? msg.split('\n') : [];
    for (let i = 0; i < lines.length; i++) {
      term.writeln(lines[i]);
    }
    term.write('\n');
  }

  /**
    Throttles the window resize event so we only do it every 50ms.
  */
  _throttledResize() {
    if (this.resizeTimeout == null) {
      this.resizeTimeout = setTimeout(() => {
        this.resizeTimeout = null;
        this.setSize(this.state.size);
      }, 50);
    }
  }

  /**
    Attaches the window resize event listener to resize the terminal when them
    window changes size.
  */
  attachResizeListener() {
    this._boundThrottledResize = this._throttledResize.bind(this);
    window.addEventListener('resize', this._boundThrottledResize, false);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._boundThrottledResize, false);
    this.term.destroy();
    this.term = null;
    // Specify the close code as chrome uses 1005 "Expected close status, received none"
    // instead of defaulting to 1000 as per the spec.
    this.ws.close(1000);
    this.ws = null;
  }

  /**
    Sets the size value in the component state to the provided value. Also
    calls to refit the terminal to the container size.
    @param {String} size The size to set the terminal to. Possible values
      are 'min' and 'max'.
  */
  setSize(size) {
    let terminalSize = null;
    if (size === 'max') {
      terminalSize = window.innerHeight - 250 + 'px';
    }
    this.setState({
      size,
      terminalSize
    }, () => {
      if (this.term) {
        this.term.fit();
        this.focus();
      }
    });
  }

  /**
    Set the focus back to the terminal so that users can keep typing.
  */
  focus() {
    const textarea = this.refs.terminal.querySelector('textarea');
    textarea.focus();
  }

  /**
    Calls to set the app state to terminal: null.
  */
  close() {
    this.props.changeState({
      terminal: null
    });
  }

  render() {
    const state = this.state;
    const terminalClassNames = classnames(
      'juju-shell__terminal', {
        'juju-shell__terminal--min': state.size === 'min'
      });
    const styles = {};
    if (state.size === 'max') {
      styles.height = state.terminalSize;
    }
    return (
      <div className="juju-shell">
        <div className="juju-shell__header">
          <span className="juju-shell__header-label">Juju Shell</span>
          <div className="juju-shell__header-actions">
            <span onClick={this.setSize.bind(this, 'min')} role="button" tabIndex="0">
              <SvgIcon name="minimize-bar_16" size="16" />
            </span>
            <span onClick={this.setSize.bind(this, 'max')} role="button" tabIndex="0">
              <SvgIcon name="maximize-bar_16" size="16" />
            </span>
            <span onClick={this.close.bind(this)} role="button" tabIndex="0">
              <SvgIcon name="close_16" size="16" />
            </span>
          </div>
        </div>
        <div className={terminalClassNames} ref="terminal" style={styles}></div>
      </div>
    );
  }

};

Terminal.propTypes = {
  WebSocket: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  // The address of the jujushell service, or an empty string if jujushell is
  // not available.
  address: PropTypes.string,
  // Credentials are used to authenticate the user to the jujushell service.
  changeState: PropTypes.func.isRequired,
  commands: PropTypes.array,
  creds: shapeup.shape({
    user: PropTypes.string,
    password: PropTypes.string,
    macaroons: PropTypes.object
  })
};

// Define jujushell API operations and codes.
const OP_LOGIN = 'login';
const OP_START = 'start';
const CODE_OK = 'ok';
const CODE_ERR = 'error';

module.exports = Terminal;
