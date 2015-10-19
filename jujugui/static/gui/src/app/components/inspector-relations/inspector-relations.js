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

YUI.add('inspector-relations', function() {

  juju.components.InspectorRelations = React.createClass({

    /**
      Get the current state of the inspector.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      var state = this.generateState(this.props);
      return state;
    },

    /**
      Generates the state for the Deployment view based on the state.

      @method generateState
      @param {Object} nextProps The props which were sent to the component.
      @return {Object} A generated state object which can be passed to setState.
    */
    generateState: function(nextProps) {
      var state = {
        activeComponent: nextProps.relations.length > 0 ?
            'relations' : 'onboarding'
      };
      switch (state.activeComponent) {
        case 'onboarding':
          state.activeChild = {
            component: <div className="inspector-relations__onboarding">
                  <p className="inspector-relations__onboarding-description">
                    This service doesn&rsquo;t have any relations. Build
                    relationships between services and find out about them here.
                  </p>
                  <div className="inspector-relations-item">
                    <span className="inspector-relations-item__details">
                      <p className="inspector-relations-item__property">
                        Interface: mysql
                      </p>
                      <p className="inspector-relations-item__property">
                        Name: slave
                      </p>
                      <p className="inspector-relations-item__property">
                        Role: client
                      </p>
                      <p className="inspector-relations-item__property">
                        Scope: global
                      </p>
                    </span>
                  </div>
                </div>
          };
        break;
        case 'relations':
          state.activeChild = {
            component: <div className="inspector-relations__list">
                  relations
                </div>
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
        <div className="inspector-relations">
          {this.state.activeChild.component}
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'inspector-relations-item'
]});
