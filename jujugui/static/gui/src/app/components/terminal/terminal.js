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
      size: 'min'
    };
    this.term = null;
    this.ws = null;
  }

  _runCommand(command) {
    this.ws.send(JSON.stringify(["stdin", `${command}\n`]));
  }

  _runCommands(commands, join) {
    if (join) {
      this._runCommand(commands.join(';'));
    } else {
      commands.forEach((command) => {
        this._runCommand(command);
      });
    }
  }

  /**
    Set up the terminal WebSocket connection, including handling of initial
    handlshake and then attaching the xterm.js session.
  */
  componentDidMount() {
    const props = this.props;
    const term = new XTerm();
    term.write('Connecting... ');
    this.term = term;
    term.on('open', () => {
      // To properly have the terminal area fit the full width we have to
      // call fit a little bit after it's been opened.
      setTimeout(() => term.fit(), 500);
    });
    term.open(
      ReactDOM.findDOMNode(this).querySelector('.juju-shell__terminal'),
      true);
    const ws = new props.WebSocket(props.address);
    this.ws = ws;
    const creds = props.creds;
    ws.onopen = () => {
      ws.send(JSON.stringify({
        operation: 'login',
        username: creds.user,
        password: creds.password,
        macaroons: creds.macaroons
      }));
      ws.send(JSON.stringify({operation: 'start'}));
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
      if (resp.code === 'error') {
        console.error(resp.message);
        props.addNotification({
          title: 'Error talking to the terminal server',
          message: 'Error talking to the terminal server: ' + resp.message,
          level: 'error'
        });
        return;
      }
      // Terminado sends a "disconnect" message when the process it's running
      // exits. When we receive that, we close the terminal.
      if (resp['0'] === 'disconnect') {
        this.close();
      }
      if (resp.code === 'ok' && resp.message === 'session is ready') {
        term.terminadoAttach(ws);
        term.writeln('connected to temporary workspace.\n');
        if (props.commands) {
          window.setTimeout(() => {
            this._runCommands(props.commands);
          }, 500);
        }
      }
    };
  }

  componentWillUnmount() {
    this.term.destroy();
    this.term = null;
    this.ws.close();
    this.ws = null;
  }

  /**
    Sets the size value in the component state to the provided value. Also
    calls to refit the terminal to the container size.
    @param {String} size The size to set the terminal to. Possible values
      are 'min' and 'max'.
  */
  setSize(size) {
    this.setState({size: size}, () => {
      if (this.term) {
        this.term.fit();
      }
    });
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
      styles.height = window.innerHeight - 250 + 'px';
    }
    return (
      <div className="juju-shell">
        <div className="juju-shell__header">
          <span className="juju-shell__header-label">Juju Shell</span>
          <div className="juju-shell__header-actions">
            <span onClick={this.setSize.bind(this, 'min')} tabIndex="0" role="button">
              <SvgIcon name="minimize-bar_16" size="16" />
            </span>
            <span onClick={this.setSize.bind(this, 'max')} tabIndex="0" role="button">
              <SvgIcon name="maximize-bar_16" size="16" />
            </span>
            <span onClick={this.close.bind(this)} tabIndex="0" role="button">
              <SvgIcon name="close_16" size="16" />
            </span>
          </div>
        </div>
        <div className={terminalClassNames} style={styles}></div>
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

module.exports = Terminal;
