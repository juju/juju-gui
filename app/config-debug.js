var juju_config = {
  consoleEnabled: true,
  serverRouting: false,
  html5: true,
  container: '#main',
  viewContainer: '#main',
  // FIXME: turn off transitions until they are fixed.
  transitions: false,
  charm_store_url: 'http://jujucharms.com/',
  // The config has three socket settings.  socket_port and socket_protocol
  // modify the current application url to determine the websocket url (always
  // adding "/ws" as the final path).  socket_url sets the entire websocket
  // url.  For backwards compatibility in the GUI charm, if you provide the
  // socket port and/or protocol *and* the socket_url, the socket_url will be
  // ignored (the port/protocol behavior overrides socket_url).
  socket_protocol: 'ws',
  socket_port: 8081,
  user: 'admin',
  password: 'admin',
  apiBackend: 'python', // Value can be 'python' or 'go'.
  readOnly: false,
  login_help: 'For this demonstration, use the password "admin" to connect.'
};
