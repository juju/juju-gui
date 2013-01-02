'use strict';

var no_login_prompts = false;

YUI.add('juju-view-login', function(Y) {

  var views = Y.namespace('juju.views');
  var Templates = views.Templates;

  var LoginView = Y.Base.create('LoginView', Y.View, [views.JujuBaseView], {
    // This is so tests can easily determine if the user was prompted.
    _prompted: false,

    /**
     * Initialize the login view.
     *
     * @return {undefined} Nothing.
     */
    initializer: function() {
      this.userIsAuthenticated = false;
      // When the server tells us the outcome of a login attempt we record
      // the result.
      this.get('env').after('log', this.handleLoginEvent, this);
    },

    /**
     * React to the results of sennding a login message to the server.
     *
     * @method handleLoginEvent
     * @param {Object} evt The event to which we are responding.
     * @return {undefined} Nothing.
     */
    handleLoginEvent: function(evt) {
      // We are only interested in the responses to login events.
      if (evt.data.op !== 'login') {
        return;
      }
      this.userIsAuthenticated = !!evt.data.result;
      this.waiting = false;
    },

    /**
     * Prompt the user for input.
     *
     * Does nothing if a special global flag has been set.  This is used so
     * tests do not generate prompts.
     *
     * @method _prompt
     * @param {String} message The message to display to the user.
     * @return {String} The string the user typed.
     */
    _prompt: function(message) {
      // no_login_prompts is a global.
      if (no_login_prompts) {
        return null;
      }
      return window.prompt(message);
    },

    /**
     * Prompt the user for their user name and password.
     *
     * @method promptUser
     * @return {undefined} Nothing.
     */
    promptUser: function() {
      this._prompted = true;
      this.set('user', this._prompt('User name'));
      this.set('password', this._prompt('Password'));
      this.waiting = true;
    },

    /**
     * Send a login RPC message to the server.
     *
     * @method validateCredentials
     * @param {String} user The user name.
     * @param {String} password The password.
     * @return {undefined} Nothing.
     */
    validateCredentials: function(user, password) {
      this.get('env').login(user, password);
    },

    /**
     * Attempt to log the user in.
     *
     * If a login attempt is outstanding, this function is a no-op.
     *
     * @method login
     * @return {undefined} Nothing.
     */
    login: function() {
      // If the server connection is not yet ready, then there is no use in
      // trying to authenticate.
      var env = this.get('env');
      if (!env.get('connected')) {
        return;
      }
      // If the credentials are known good or we are waiting to find out, exit
      // early.
      if (this.userIsAuthenticated || this.waiting) {
        return;
      }
      // If there are no stored credentials, prompt the user for some.
      if (!Y.Lang.isValue(this.get('user'))) {
        this.promptUser();
      }
      this.validateCredentials(this.get('user'), this.get('password'));
    }

  });

  views.LoginView = LoginView;

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'node',
    'handlebars'
  ]
});

