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

YUI.add('entity-details', function() {

  juju.components.EntityDetails = React.createClass({
    /* Define and validate the properites available on this component. */
    propTypes: {
      changeState: React.PropTypes.func.isRequired,
      deployService: React.PropTypes.func.isRequired,
      getEntity: React.PropTypes.func.isRequired,
      id: React.PropTypes.string.isRequired,
      pluralize: React.PropTypes.func.isRequired
    },

    /**
      Callback for when an entity has been successfully fetched. Though the
      data passed in is an Array of models, only the first model is used.

      @method fetchSuccess
      @param {Array} models A list of the entity models found.
    */
    fetchSuccess: function(models) {
      if (models.length > 0 && this.isMounted()) {
        this.setState({entityModel: models[0]});
      }
    },

    /**
      Callback for when an error occurs while fetching an entity.

      @method fetchFailure
      @param {Object} response The failure response.
    */
    fetchFailure: function(response) {
      // XXX Implement error handling.
      console.error('Fetching the entity failed.');
    },

    getInitialState: function() {
      return {
        entityModel: null,
      };
    },

    componentDidMount: function() {
      this.props.getEntity(
        this.props.id,
        this.fetchSuccess,
        this.fetchFailure
      );
    },

    render: function() {
      var entityModel = this.state.entityModel,
          output;
      if (!entityModel) {
        output = (
          <div className="spinner-loader">Loading...</div>
        );
      } else {
        output = (
          <div className={'entity-details ' + entityModel.get('entityType')}>
            <juju.components.EntityHeader
              entityModel={entityModel}
              importBundleYAML={this.props.importBundleYAML}
              getBundleYAML={this.props.getBundleYAML}
              changeState={this.props.changeState}
              deployService={this.props.deployService}
              pluralize={this.props.pluralize} />
            <juju.components.EntityContent
              entityModel={entityModel} />
          </div>
        );
      }
      return output;
    }
  });

}, '0.1.0', {
  requires: [
    'entity-header',
    'entity-content'
  ]
});
