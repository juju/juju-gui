'use strict';

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
      this.get('env').after('login', this.handleLoginEvent, this);
    },

    handleLoginEvent: function(evt) {
      this.userIsAuthenticated = (evt.data.result === 'success');
      //this.waiting = false;
    },

    promptUser: function() {
      this._prompted = true;
//      this.set('user', prompt('User name'));
//      this.set('password', prompt('Password'));
      this.waiting = true;
    },

    validateCredentials: function(user, password) {
      this.get('env').login(user, password);
    },

    login: function() {
      // If there are no stored credentials, prompt the user for some.
      if (!Y.Lang.isValue(this.get('user'))) {
        this.promptUser();
      }
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

