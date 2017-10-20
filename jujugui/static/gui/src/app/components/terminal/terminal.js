/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');
const ReactDOM = require('react-dom');
const shapeup = require('shapeup');
const XTerm = require('xterm');

// xterm.js loads plugins by requiring them. This changes the prototype of the
// xterm object. This is inherently dirty, but not really up to us, and perhaps
// not something we can change.
require('xterm/lib/addons/terminado/terminado');

const Lightbox = require('../lightbox/lightbox');
const SvgIcon = require('../svg-icon/svg-icon');

/** Terminal component used to display the Juju shell. */
class Terminal extends React.Component {

  constructor(props) {
    super(props);
    this.state = {opened: false};
    this.term = null;
    this.ws = null;
  }

  componentDidUpdate(prevProps, prevState) {
    const state = this.state;
    if (prevState.opened && !state.opened) {
      this.stopTerm();
      return;
    }
    if (!prevState.opened && state.opened) {
      this.startTerm();
    }
  }

  setOpened(opened, evt) {
    this.setState({opened: opened});
  }

  startTerm() {
    const props = this.props;
    // For now, the shell server is listening for ws (rather than wss)
    // connections. This will need to be changed when certs are passed in.
    const ws = new WebSocket(`ws://${props.address}/ws/`);
    ws.onopen = () => {
      const macaroons = props.creds.macaroons && [props.creds.macaroons];
      ws.send(JSON.stringify({
        operation: 'login',
        username: props.creds.user,
        password: props.creds.password,
        macaroons: macaroons
      }));
      ws.send(JSON.stringify({operation: 'start'}));
    };
    ws.onerror = err => {
      // TODO include notification
      console.error('WebSocket error:', err);
    };
    ws.onmessage = evt => {
      const resp = JSON.parse(evt.data);
      if (resp.code === 'error') {
        console.error(resp.message);
        return;
      }
      if (resp.code === 'ok' && resp.message === 'session is ready') {
        const term = new XTerm();
        term.terminadoAttach(ws);
        term.open(ReactDOM.findDOMNode(this)
          .querySelector('.juju-shell__terminal-container'));
        this.term = term;
      }
    };
    this.ws = ws;
  }

  stopTerm() {
    this.term.destroy();
    this.term = null;
    this.ws.close();
    this.ws = null;
  }

  render() {
    if (this.state.opened) {
      return (
        <Lightbox close={this.setOpened.bind(this, false)}>
          <div className="juju-shell__terminal-container"></div>
        </Lightbox>
      );
    }
    const props = this.props;
    const address = props.address;
    const classes = classNames(
      'model-actions__import',
      'model-actions__button',
      {'model-actions__button-disabled': !address}
    );
    return (
      <span className={classes}
        onClick={address && this.setOpened.bind(this, true)}
        role="button"
        tabIndex="0">
        <SvgIcon name="code-snippet_24"
          className="model-actions__icon"
          size="16" />
        <span className="tooltip__tooltip--below">
          <span className="tooltip__inner tooltip__inner--up">
            Juju shell
          </span>
        </span>
      </span>
    );
  }

};

Terminal.propTypes = {
  // The address of the jujushell service, or an empty string if jujushell is
  // not available.
  address: PropTypes.string,
  // Credentials are used to authenticate the user to the jujushell service.
  creds: shapeup.shape({
    user: PropTypes.string,
    password: PropTypes.string,
    macaroons: PropTypes.array
  })
};

module.exports = Terminal;
