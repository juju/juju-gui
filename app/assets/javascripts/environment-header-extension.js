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


YUI.add('environment-header-extension', function(Y) {

  /**
   * Adds the environment header functionality to the app. You need to call
   * the _renderEnvironmentHeaderView from the render method of the view to
   * trigger because Y.View's do not offer any render event.
   *
   * @namespace juju
   * @class EnvironmentHeader
   */
  function EnvironmentHeader() {}

  EnvironmentHeader.prototype = {
    /**
     * Destroy the view.
     *
     * @method destroyEnvironmentHeader
     */
    destroyEnvironmentHeader: function() {
      this.environmentHeader.destroy();
    },

    /**
     * Sets up the View and renders it to the DOM.
     *
     * @method _renderEnvironmentHeaderView
     */
    _renderEnvironmentHeaderView: function() {
      var views = Y.namespace('juju.views');
      var header = new views.EnvironmentHeaderView({
        container: Y.one('#environment-header')
      }).render();
      this.addEvent(
          header.on(
              'changeEnvironmentView', this._onChangeEnvironmentView, this));
      this.environmentHeader = header;
    },

    /**
      Callback for the user changing the enironment view toggle.

      @method _onChangeEnvironmentView
      @param {Object} e Event object.
    */
    _onChangeEnvironmentView: function(e) {
      var change = {},
          environment = e.environment;
      if (environment === 'serviceView') { change = { topology: true }; }
      else if (environment === 'machineView') { change = { machine: true }; }
      this.get('subApps').charmbrowser.fire('viewNavigate', { change: change });
    }
  };

  Y.namespace('juju').EnvironmentHeader = EnvironmentHeader;

}, '0.1.0', {
  requires: [
    'view',
    'environment-header'
  ]
});
