/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

YUI.add('inspector-component', function() {

  juju.components.Inspector = React.createClass({

    /**
      Get the current state of the inspector.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      return {};
    },

    /**
      Callback for when the header back is clicked.

      @method _backCallback
    */
    _backCallback: function() {
      this.props.changeState(this.state.activeChild.backState);
    },

    render: function() {
      var service = this.props.service;
      var activeComponent = this.props.getAppState(
          'current', 'sectionA', 'metadata').activeComponent;
      switch (activeComponent) {
        case undefined:
          this.state.activeChild = {
            title: service.get('name'),
            component: <juju.components.ServiceOverview
              changeState={this.props.changeState}
              service={service} />,
            backState: {
              sectionA: {
                component: 'services'
              }}};
        break;
        case 'units':
          this.state.activeChild = {
            title: 'Units',
            component:
              <juju.components.UnitList
                units={service.get('units')} />,
            backState: {
              sectionA: {
                component: 'inspector',
                metadata: {
                  id: service.get('id'),
                  activeComponent: undefined
                }}}};
        break;
      }
      return (
        <div className="inspector-view">
          <juju.components.InspectorHeader
            backCallback={this._backCallback}
            title={this.state.activeChild.title} />
          <div className="inspector-content">
            {this.state.activeChild.component}
          </div>
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'inspector-header',
    'unit-list',
    'service-overview'
    ]
});
