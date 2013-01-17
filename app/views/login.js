'use strict';

YUI.add('juju-view-login', function(Y) {

  var views = Y.namespace('juju.views');

  var LoginView = Y.Base.create('LoginView', Y.View, [views.JujuBaseView], {
    template: views.Templates.login,
    events: {
      '#login-form input[type=submit]': {click: 'login'}
    },

    /**
     * Login event handler. When clicking the login form submit button,
     * disable the form, take username and password from the input fields
     * and put them in the environment, and call the environment login method.
     *
     * @method login
     * @param {Object} ev An event object (with a "currentTarget" attribute).
     * @return {undefined} Mutates only.
    **/
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

    /**
     * Render the page.
     *
     * Reveal the mask element, and show the login form.
     *
     * @method render
     * @return {undefined} Mutates only.
    **/
    render: function() {
      // In order to have the mask cover everything, it needs to be an
      // immediate child of the body.  In order for it to render immediately
      // when the app loads, it needs to be in index.html.
      var loginMask = Y.one('body > #login-mask');
      if (!loginMask) {
        // No login mask in the DOM, as is the case in tests.
        return this;
      }
      loginMask.show();
      var env = this.get('env');
      var environment_name_node = Y.one('#environment-name');
      var provider_type_node = Y.one('#provider-type');
      var environment_name = (
          environment_name_node ?
          environment_name_node.get('text') : 'Environment');
      var provider_type = (
          provider_type_node ? provider_type_node.get('text') : '');
      // In order to have events work and the view cleanly be replaced by
      // other views, we need to put the contents in the usual "container"
      // node, even though it is not a child of the mask node.
      this.get('container').setHTML(this.template({
        environment_name: environment_name,
        provider_type: provider_type,
        error_text: (
            env.failedAuthentication ? 'Unknown user or password.' : ''),
        help_text: this.get('help_text')
      }));
      return this;
    }

  });

  views.login = LoginView;

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'node'
  ]
});
