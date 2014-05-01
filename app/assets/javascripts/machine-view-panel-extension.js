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


YUI.add('machine-view-panel-extension', function(Y) {

  /**
   * Adds the machine view panel functionality to the app. You need to call
   * the _renderMachineViewPanelView from the render method of the view to
   * trigger because Y.View's do not offer any render event.
   *
   * @namespace juju
   * @class MachineViewPanel
   */
  function MachineViewPanel() {}

  MachineViewPanel.prototype = {
    /**
     * Destroy the view.
     *
     * @method destroyMachineViewPanel
     */
    destroyMachineViewPanel: function() {
      this.machineViewPanel.destroy();
    },

    /**
     * Sets up the View and renders it to the DOM.
     *
     * @method _renderMachineViewPanelView
     */
    _renderMachineViewPanelView: function(db) {
      var views = Y.namespace('juju.views');
      this.machineViewPanel = new views.MachineViewPanelView({
        container: Y.one('#machine-view-panel'),
        db: db
      }).render();
    }
  };

  Y.namespace('juju').MachineViewPanel = MachineViewPanel;

}, '0.1.0', {
  requires: [
    'view',
    'machine-view-panel'
  ]
});
