var juju_config = {
  consoleEnabled: true,
  serverRouting: false,
  html5: true,
  container: '#main',
  viewContainer: '#main',
  // FIXME: turn off transitions until they are fixed.
  transitions: false,
  charm_store_url: 'http://jujucharms.com/',
  socket_port: 8081,
  user: 'admin',
  password: 'admin',
  apiBackend: 'python', // Value can be 'python' or 'go'.
  readOnly: false,
  login_help: 'For this demonstration, use the password "admin" to connect.'
};
