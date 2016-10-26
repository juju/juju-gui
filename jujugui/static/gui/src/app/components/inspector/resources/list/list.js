/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

YUI.add('inspector-resources-list', function() {

  juju.components.InspectorResourcesList = React.createClass({

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      charmId: React.PropTypes.string.isRequired,
      getResources: React.PropTypes.func.isRequired
    },

    /**
      Get the current state.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      this.resourcesXHR = null;
      return {
        loading: false,
        resources: null
      };
    },

    componentDidMount: function() {
      this._getResources(this.props.charmId);
    },

    componentWillUnmount: function() {
      this.resourcesXHR.abort();
    },

    /**
      Get a list of resources for the charm.

      @method _getResources
      @param {String} charmId The charm id.
    */
    _getResources: function(charmId) {
      this.setState({loading: true});
      this.resourcesXHR = this.props.getResources(
          charmId, this._getResourcesCallback);
    },

    /**
      Update the state with the returned versions.

      @method _getResourcesSuccess
      @param {String} error The error message, if any. Null if no error.
      @param {Array} data The resources data.
    */
    _getResourcesCallback: function(error, data) {
      if (error) {
        console.error(error);
      }
      this.setState({loading: false, resources: data});
    },

    /**
      Generate a list of resources to display.

      @returns {Object} The resource list markup.
    */
    _generateResources: function() {
      if (this.state.loading) {
        return (
          <div className="inspector-resources-list__loading">
              <juju.components.Spinner />
          </div>);
      }
      const resources = this.state.resources || [];
      if (resources.length === 0) {
        return (
          <div className="inspector-resources-list__empty">
              No resources available.
          </div>);
      }
      const resourceList = resources.map((resource, i) => {
        return (
          <li className="inspector-resources-list__resource"
            key={resource.name + i}>
              <p>{resource.name}</p>
              <p>{resource.description}</p>
          </li>);
      });
      return (
        <ul className="inspector-resources-list__list">
            {resourceList}
        </ul>);
    },

    render: function() {
      return (
        <div className="inspector-resources-list">
            {this._generateResources()}
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'loading-spinner'
]});
