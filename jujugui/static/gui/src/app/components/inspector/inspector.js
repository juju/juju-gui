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
      return this.generateState(this.props);
    },

    /**
      Callback for when the header back is clicked.

      @method _backCallback
    */
    _backCallback: function() {
      this.props.changeState(this.state.activeChild.backState);
    },

    /**
      Generates the state for the inspector based on the app state.

      @method generateState
      @param {Object} nextProps The props which were sent to the component.
      @return {Object} A generated state object which can be passed to setState.
    */
    generateState: function(nextProps) {
      var service = nextProps.service;
      var state = {
        activeComponent: nextProps.appState.sectionA.metadata.activeComponent
      };
      switch (state.activeComponent) {
        case undefined:
          state.activeChild = {
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
          state.activeChild = {
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
      return state;
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState(this.generateState(nextProps));
    },

    render: function() {
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
