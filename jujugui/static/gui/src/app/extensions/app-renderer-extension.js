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
        showEnvSwitcher: false
    */
    _renderBreadcrumb: function({ showEnvSwitcher=true } = {}) {
      // If this.env is undefined then do not render the switcher because there
      // is no env to connect to. It will be undefined when the breadcrumb
      // is rendered in the callback for generateSocketUrl because an env
      // has not yet been created.
      var env = this.env;
      // If gisf is enabled then we won't be connected to a model to know
      // what facades are supported but we can reliably assume it'll be Juju 2
      // or higher which will support the necessary API calls.
      if (!this.get('gisf')) {
        if(!env || env.findFacadeVersion('ModelManager') === null &&
           env.findFacadeVersion('EnvironmentManager') === null) {
          // We do not want to show the model switcher if it isn't supported as
          // it throws an error in the browser console and confuses the user
          // as it's visible but not functional.
          showEnvSwitcher = false;
        }
      }
      // If we're in sandbox we don't want to display the switcher.
      if (this.get('sandbox')) {
        showEnvSwitcher = false;
      }
      var uncommittedChanges = false;
      if (env) {
        var currentChangeSet = env.get('ecs').getCurrentChangeSet();
        uncommittedChanges = Object.keys(currentChangeSet).length > 0;
      }
      var auth = this._getAuth();
      var envName = this.db.environment.get('name');
      var state = this.state;
      ReactDOM.render(
        <juju.components.HeaderBreadcrumb
          env={env}
          envName={envName}
          dbEnvironmentSet={this.db.environment.set.bind(this.db.environment)}
          jem={this.jem}
          envList={this.get('environmentList')}
          changeState={this.changeState.bind(this)}
          getAppState={state.getState.bind(state)}
          showConnectingMask={this.showConnectingMask.bind(this)}
          authDetails={auth}
          showEnvSwitcher={showEnvSwitcher}
          switchModel={views.utils.switchModel.bind(
            this, this.createSocketURL.bind(this),
            this.switchEnv.bind(this), env)}
          uncommittedChanges={uncommittedChanges} />,
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
