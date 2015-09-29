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

YUI.add('charmbrowser-component', function() {

  juju.components.Charmbrowser = React.createClass({

    /**
      Get the current state of the charmbrowser.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      return this.generateState(this.props);
    },

    /**
      Generates the state for the charmbrowser based on the app state.

      @method generateState
      @param {Object} nextProps The props which were sent to the component.
      @return {Object} A generated state object which can be passed to setState.
    */
    generateState: function(nextProps) {
      var state = {
        activeComponent: nextProps.appState.sectionC.metadata.activeComponent
      };
      var query = this.props.query;
      switch (state.activeComponent) {
        case 'mid-point':
          state.activeChild = {
            panelInstanceName: 'mid-point-panel',
            component:
              <juju.components.MidPoint
                addService={this.props.addService} />
          };
        break;
        case 'search-results':
          state.activeChild = {
            panelInstanceName: 'white-box',
            component:
              <juju.components.SearchResults
                charmstore={this.props.charmstore}
                query={query} />
          };
        break;
      }
      return state;
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState(this.generateState(nextProps));
    },

    render: function() {
      return (
        <juju.components.Panel
          instanceName={this.state.activeChild.panelInstanceName}
          visible={true}>
          {this.state.activeChild.component}
        </juju.components.Panel>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'mid-point',
    'search-results'
  ]
});
