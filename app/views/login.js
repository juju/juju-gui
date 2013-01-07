'use strict';

// Should login prompts be presented?  Turned on for testing.
var noLogin = noLogin || false;

YUI.add('juju-view-login', function(Y) {

  var views = Y.namespace('juju.views');
  var Templates = views.Templates;

  var LoginView = Y.Base.create('LoginView', Y.View, [views.JujuBaseView], {
    // This is so tests can easily determine if the user was prompted.
    _prompted: false,

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
      // noLogin is a global.
      if (noLogin) {
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
      var env = this.get('env');
      // The user's name is always "admin".
      env.set('user', 'admin');
      env.set('password', this._prompt('Password'));
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

