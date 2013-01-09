'use strict';

// Should login prompts be presented?  Turned on for testing.
var noLogin = noLogin || false;

YUI.add('juju-view-login', function(Y) {

  var views = Y.namespace('juju.views');
  var Templates = views.Templates;

  var LoginView = Y.Base.create('LoginView', Y.View, [views.JujuBaseView], {
    template: Templates.login,
    events: {
      '#login-form input[type=submit]': {click: 'login'}
    },

    login: function(ev) {
      ev.preventDefault();
      if (ev.currentTarget.get('disabled')) {
        return;
      }
      var env = this.get('env');
      var container = this.get('container');
      container.all('input').set('disabled', true);
      env.set('user', container.one('input[type=text]').get('value'));
      env.set('password', container.one('input[type=password]').get('value'));
      env.login();
    },

    render: function() {
      var env = this.get('env');
      var app = this.get('app');
      // In order to have the mask cover everything, it needs to be an
      // immediate child of the body.  In order for it to render immediately
      // when the app loads, it needs to be in index.html.
      Y.one('body > #login-mask').setStyle('display', 'block');
      // In order to have events work and the view cleanly be replaced by
      // other views, we need to put the contents in the usual "container"
      // node, even though it is not a child of the mask node.
      this.get('container').setHTML(this.template({
        environment_name: Y.one('#environment-name').get('text'),
        provider_type: Y.one('#provider-type').get('text'),
        error_text: (
          env.failedAuthentication ? 'Unknown user and password.' : ''),
        help_text: app.get('login_help')
      }));
      return this;
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
