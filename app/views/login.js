'use strict';

// Should login prompts be presented?  Turned on for testing.
var noLogin = noLogin || false;

YUI.add('juju-view-login', function(Y) {

  var views = Y.namespace('juju.views');
  var Templates = views.Templates;

  var LoginView = Y.Base.create('LoginView', Y.View, [views.JujuBaseView], {
    // This is so tests can easily determine if the user was prompted.
    _prompted: false,
    template: Templates.login,

    render: function() {
      if (this._prompted) {
        var env = this.get('env');
        var password = ''; // get it from the request
        // The user's name is always "admin".
        env.set('user', 'admin');
        env.set('password', password);
      } else {
        this._prompted = true;
        this.get('container').setHTML(this.template({
          environment_name: 'Environment',
          provider: 'Provider',
          help_text: 'Help text'
        }));
      }
    }

  });

  views.login = LoginView;

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'node',
    'handlebars'
  ]
});
