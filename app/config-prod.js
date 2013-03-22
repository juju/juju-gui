var juju_config = {
  // These are blacklisted config items not passed into subapps mounted into
  // the main App.
  serverRouting: false,
  html5: true,
  container: '#main',
  viewContainer: '#main',
  // FIXME: turn off transitions until they are fixed.
  transitions: false,

  // These are the main application config items used and passed down into all
  // SubApps.
  consoleEnabled: false,
  charm_store_url: 'http://jujucharms.com/',
  charmworldURL: 'http://staging.jujucharms.com',
  // The config has three socket settings.  socket_port and socket_protocol
  // modify the current application url to determine the websocket url (always
  // adding "/ws" as the final path).  socket_url sets the entire websocket
  // url.  For backwards compatibility in the GUI charm, if you provide the
  // socket port and/or protocol *and* the socket_url, the socket_url will be
  // ignored (the port/protocol behavior overrides socket_url).
  socket_protocol: 'ws',
  socket_port: 8081,
  user: undefined,
  password: undefined,
  apiBackend: 'python', // Value can be 'python' or 'go'.
  readOnly: false,
  login_help: (
      'The password is the admin-secret from the Juju environment.  This can ' +
      'often be found by looking in ~/.juju/environments.yaml.')
};
