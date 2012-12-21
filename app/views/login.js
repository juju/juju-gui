'use strict';

var no_login_prompts = false;

YUI.add('juju-view-login', function(Y) {

  var views = Y.namespace('juju.views');
  var Templates = views.Templates;

  var LoginView = Y.Base.create('LoginView', Y.View, [views.JujuBaseView], {
    // This is so tests can easily determine if the user was prompted.
    _prompted: false,

    initializer: function() {
      this.userIsAuthenticated = false;
      // When the server tells us the outcome of a login attempt we record
      // the result.
      this.get('env').after('log', this.handleLoginEvent, this);
    },

    handleLoginEvent: function(evt) {
      // We are only interested in the responses to login events.
      if (evt.data.op !== 'login') {
        return;
      }
      this.userIsAuthenticated = !!evt.data.result;
      this.waiting = false;
    },

    _prompt: function(message) {
      // no_login_prompts is a global.
      if (no_login_prompts) {
        return null;
      }
      return prompt(message);
    },

    promptUser: function() {
      this._prompted = true;
      this.set('user', this._prompt('User name'));
      this.set('password', this._prompt('Password'));
      this.waiting = true;
    },

    validateCredentials: function(user, password) {
      this.get('env').login(user, password);
    },

    login: function() {
      // If the server connection is not yet ready, then there is no use in
      // trying to authenticate.
      var env = this.get('env');
      if (!env.get('serverReady')) {
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

