/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

/**
 * Provide the LoginView class.
 *
 * @module views
 * @submodule views.login
 */

YUI.add('juju-view-login', function(Y) {

  var views = Y.namespace('juju.views');

  /**
   * The LoginView class.
   *
   * @class LoginView
   */
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
     */
    login: function(ev) {
      ev.preventDefault();
      if (ev.currentTarget.get('disabled')) {
        return;
      }
      var env = this.get('env');
      var container = this.get('container');
      container.all('input').set('disabled', true);
      env.setCredentials({
        user: container.one('input[type=text]').get('value'),
        password: container.one('input[type=password]').get('value')
      });
      env.login();
    },

    /**
     * Check the version of juju-core to see if the username should be
     * locked to admin.
     *
     * @method _shouldLockAdmin
     * @return {Boolean} Whether the username should be locked to admin.
     */
    _shouldLockAdmin: function() {
      if (window.juju_config && window.juju_config.jujuCoreVersion) {
        var version = parseFloat(window.juju_config.jujuCoreVersion.split(
            '.').slice(0, 2).join('.'));
        if (version < 1.21) {
          return true;
        }
      }
      return false;
    },

    /**
     * Render the page.
     *
     * Reveal the mask element, and show the login form.
     *
     * @method render
     * @return {undefined} Mutates only.
     */
    render: function() {
      // In order to have the mask cover everything, it needs to be an
      // immediate child of the body.  In order for it to render immediately
      // when the app loads, it needs to be in index.html.
      var mask = Y.one('body > #full-screen-mask');
      if (!mask) {
        // No mask in the DOM, as is the case in tests.
        return this;
      }
      // No loading message in tests.
      var loading_message = Y.one('#loading-message');
      if (Y.Lang.isValue(loading_message)) {
        loading_message.hide();
      }
      mask.show();
      var env = this.get('env');
      var environment_name_node = Y.one('#environment-name');
      var environment_name = (
          environment_name_node ?
          environment_name_node.get('text') : 'Environment');
      var error_text = '';
      if (env.failedAuthentication) {
        error_text = 'Unknown user or password.';
      } else if (env.failedTokenAuthentication) {
        error_text = (
            'The one-time token was unknown, expired, or already used.');
      }
      // In order to have events work and the view cleanly be replaced by
      // other views, we need to put the contents in the usual "container"
      // node, even though it is not a child of the mask node.
      var user = env.get('user') || env.defaultUser;
      if (/^user-/.test(user)) {
        user = user.substring(5);
      }
      this.get('container').setHTML(this.template({
        environment_name: environment_name,
        error_text: error_text,
        user: user,
        lockAdmin: this._shouldLockAdmin(),
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
