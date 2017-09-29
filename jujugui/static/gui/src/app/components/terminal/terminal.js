/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const shapeup = require('shapeup');
const XTerm = require('xterm');
require('xterm/lib/addons/terminado/terminado')

const GenericButton = require('../generic-button/generic-button');
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
    if (evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }
    this.setState({opened: opened});
  }

  startTerm() {
    const props = this.props;
    const ws = new WebSocket(`ws://${props.address}/ws/`);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        operation: 'login',
        username: props.creds.user,
        password: props.creds.password,
        macaroons: props.creds.macaroons
      }));
      ws.send(JSON.stringify({operation: 'start'}));
    };
    ws.onerror = err => {
      console.error('WebSocket error:', err);
    };
    ws.onmessage = evt => {
      const resp = JSON.parse(evt.data)
      if (resp.code === 'error') {
        console.error(resp.message);
        return
      }
      if (resp.code === 'ok' && resp.message === 'session is ready') {
        const term = new XTerm();
        term.terminadoAttach(ws);
        term.open(document.getElementById('juju-shell'));
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
          <div id="juju-shell"></div>
        </Lightbox>
      );
    }
    const props = this.props;
    const address = props.address;
    let classes = 'model-actions__import model-actions__button'
    if (!address) {
      classes += ' model-actions__button-disabled';
    }
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
    macaroons: PropTypes.object
  })
};

module.exports = Terminal;
