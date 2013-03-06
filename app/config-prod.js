var juju_config = {
  consoleEnabled: false,
  serverRouting: false,
  html5: true,
  container: '#main',
  viewContainer: '#main',
  // FIXME: turn off transitions until they are fixed.
  transitions: false,
  charm_store_url: 'http://jujucharms.com/',
  socket_port: 8081,
  user: undefined,
  password: undefined,
  apiBackend: 'python', // Value can be 'python' or 'go'.
  readOnly: false,
  login_help: (
      'The password is the admin-secret from the Juju environment.  This can ' +
      'often be found by looking in ~/.juju/environments.yaml.')
};
