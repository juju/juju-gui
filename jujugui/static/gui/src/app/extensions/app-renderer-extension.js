/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2013 Canonical Ltd.

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

YUI.add('app-renderer-extension', function(Y) {

  var views = Y.namespace('juju.views');

  /**
    Encapsulates the rendering logic for easy testing and separation from the
    gigantic monolith that is app.js.

    @method AppRenderer
  */
  function AppRenderer() {}

  AppRenderer.prototype = {

    /**
      Renders the breadcrumb component to the DOM.

      @method _renderBreadcrumb
      @param {Object} options
        showEnvSwitcher: true
    */
    _renderBreadcrumb: function({ showEnvSwitcher=true } = {}) {
      const env = this.env;
      const utils = views.utils;
      const state = this.state;
      // If this.env is undefined then do not render the switcher because there
      // is no env to connect to. It will be undefined when the breadcrumb
      // is rendered in the callback for generateSocketUrl because an env
      // has not yet been created.
      if (!this.controllerAPI || (this.get('sandbox') && !this.get('gisf'))) {
        // We do not want to show the model switcher if it isn't supported as
        // it throws an error in the browser console and confuses the user
        // as it's visible but not functional.
        showEnvSwitcher = false;
      }
      ReactDOM.render(
        <juju.components.HeaderBreadcrumb
          envName={this.db.environment.get('name')}
          envList={this.get('environmentList')}
          getAppState={state.getState.bind(state)}
          authDetails={this._getAuth()}
          listModels={
            this.controllerAPI.listModelsWithInfo.bind(this.controllerAPI)}
          showEnvSwitcher={showEnvSwitcher}
          showProfile={utils.showProfile.bind(
            this, env && env.get('ecs'), this.changeState.bind(this))}
          switchModel={utils.switchModel.bind(
            this, this.createSocketURL.bind(this, this.get('socketTemplate')),
            this.switchEnv.bind(this), env)} />,
        document.getElementById('header-breadcrumb'));
    },

  };

  Y.namespace('juju').AppRenderer = AppRenderer;

}, '0.1.0', {
  requires: [
    'base',
    'juju-view-utils'
  ]
});
