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
      const controllerAPI = this.controllerAPI;
      const utils = views.utils;
      const auth = this._getAuth();
      let listModelsWithInfo =
        controllerAPI &&
          controllerAPI.listModelsWithInfo.bind(this.controllerAPI);
      // If controller is undefined then do not render the switcher because
      // there is no controller to connect to. It will be undefined when the
      // breadcrumb is initially rendered because it hasn't yet been given
      // time to connect and login.
      if (!controllerAPI) {
        // We do not want to show the model switcher if it isn't supported as
        // it throws an error in the browser console and confuses the user
        // as it's visible but not functional.
        showEnvSwitcher = false;
      }
      // It's possible that we have a controller instance and no facade if
      // we've connected but have not yet successfully logged in. This will
      // prevent the model switcher from rendering but after the login this
      // component will be re-rendered.
      if (controllerAPI &&
        controllerAPI.findFacadeVersion('ModelManager') === null) {
        showEnvSwitcher = false;
      }
      ReactDOM.render(
        <juju.components.HeaderBreadcrumb
          acl={this.acl}
          appState={this.state}
          authDetails={auth}
          changeState={this.state.changeState.bind(this.state)}
          humanizeTimestamp={views.humanizeTimestamp}
          listModelsWithInfo={listModelsWithInfo}
          modelName={this.db.environment.get('name')}
          modelOwner={env.get('modelOwner')}
          showEnvSwitcher={showEnvSwitcher}
          showProfile={utils.showProfile.bind(
            this, env && env.get('ecs'),
            this.state.changeState.bind(this.state))}
          switchModel={utils.switchModel.bind(this, env)}
          loadingModel={this.env.loading} />,
        document.getElementById('header-breadcrumb'));
    },
  };

  Y.namespace('juju').AppRenderer = AppRenderer;

}, '0.1.0', {
  requires: [
    'base',
    'header-breadcrumb',
    'juju-view-utils'
  ]
});
