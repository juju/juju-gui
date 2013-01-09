var juju_config = {
  consoleEnabled: false,
  serverRouting: false,
  html5: true,
  container: '#main',
  viewContainer: '#main',
  // FIXME: turn off transitions until they are fixed.
  transitions: false,
  charm_store_url: 'http://jujucharms.com/',
  socket_url: 'ws://localhost:8081/ws',
  login_help: (
    'The password is the admin-secret from the Juju environment.  This can ' +
    'often be found by looking in ~/.juju/environments.yaml.')
};
