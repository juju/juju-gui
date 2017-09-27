/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const shapeup = require('shapeup');

const GenericButton = require('../generic-button/generic-button');
const Lightbox = require('../lightbox/lightbox');
const XTerm = require('xterm');
require('xterm/lib/addons/terminado/terminado')

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
        // terminadoAttach(term, ws);
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
    return (
      <GenericButton
        action={this.setOpened.bind(this, true)}
        disabled={!props.address}>
        <span>$_</span>
      </GenericButton>
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

function terminadoAttach(term, socket, bidirectional, buffered) {
  bidirectional = (typeof bidirectional == 'undefined') ? true : bidirectional;
  term.socket = socket;

  term._flushBuffer = function () {
    term.write(term._attachSocketBuffer);
    term._attachSocketBuffer = null;
    clearTimeout(term._attachSocketBufferTimer);
    term._attachSocketBufferTimer = null;
  };

  term._pushToBuffer = function (data) {
    if (term._attachSocketBuffer) {
      term._attachSocketBuffer += data;
    } else {
      term._attachSocketBuffer = data;
      setTimeout(term._flushBuffer, 10);
    }
  };

  term._getMessage = function (ev) {
    var data = JSON.parse(ev.data)
    if( data[0] == "stdout" ) {
      if (buffered) {
        term._pushToBuffer(data[1]);
      } else {
        term.write(data[1]);
      }
    }
  };

  term._sendData = function (data) {
    socket.send(JSON.stringify(['stdin', data]));
  };

  term._setSize = function (size) {
    socket.send(JSON.stringify(['set_size', size.rows, size.cols]));
  };

  socket.addEventListener('message', term._getMessage);

  if (bidirectional) {
    term.on('data', term._sendData);
  }
  term.on('resize', term._setSize);
};
