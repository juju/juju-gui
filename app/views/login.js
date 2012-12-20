'use strict';

YUI.add('juju-view-login', function(Y) {

  var views = Y.namespace('juju.views');
  var Templates = views.Templates;

  var LoginView = Y.Base.create('LoginView', Y.View, [views.JujuBaseView], {
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
//      this.user_name = prompt('User name');
//      this.password = prompt('Password');
      this.set('waiting', true);
    },

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

