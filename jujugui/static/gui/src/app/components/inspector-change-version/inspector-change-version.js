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

YUI.add('inspector-change-version', function() {

  juju.components.InspectorChangeVersion = React.createClass({

    /**
      Get the current state.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      return {
        versionsList: null
      };
    },

    componentDidMount: function() {
      this._getVersions(this.props.charmId);
    },

    componentWillReceiveProps: function(nextProps) {
      this._getVersions(nextProps.charmId);
    },

    /**
      The callable to be passed to the version item to view the charm details.

      @method _viewCharmDetails
      @param {Object} e The click event.
    */
    _viewCharmDetails: function(charmId, e) {
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'entity-details',
            id: charmId.replace('cs:', '')
          }
        }
      });
    },

    /**
    The callable to be passed to the version item to change versions.

      @method _versionButtonAction
      @param {Object} e The click event.
    */
    _versionButtonAction: function(charmId, e) {
      console.log('change version', charmId);
    },

    /**
      Get a list of versions for the charm.

      @method _getVersions
      @param {String} charmId The charm id.
    */
    _getVersions: function(charmId) {
      this.props.getAvailableVersions(charmId,
          this._getVersionsSuccess, this._getVersionsFailure);
    },

    /**
      Update the state with the returned versions.

      @method _getVersionsSuccess
    */
    _getVersionsSuccess: function(versions) {
      var components = [];
      if (versions.length === 0) {
        components = '<li>No other versions.</li>';
      }
      var currentVersion = this._getVersionNumber(this.props.charmId);
      versions.forEach(function(version) {
        var thisVersion = this._getVersionNumber(version);
        var downgrade = false;
        if (thisVersion === currentVersion) {
          return true;
        } else if (thisVersion < currentVersion) {
          downgrade = true;
        }
        components.push(
          <juju.components.InspectorChangeVersionItem
            key={version}
            downgrade={downgrade}
            itemAction={this._viewCharmDetails.bind(this, version)}
            buttonAction={this._versionButtonAction.bind(this, version)}
            id={version} />);
      }, this);
      this.setState({versionsList: components});
    },

    /**
      Get the version number from the charm id.

      @method _getVersionNumber
      @param {String} charmId The charm id.
      @returns {Integer} The version number.
    */
    _getVersionNumber: function(charmId) {
      var parts = charmId.split('-');
      return parseInt(parts[parts.length - 1]);
    },

    /**
      Handle failures in getting versions.

      @method _getVersionsFailure
    */
    _getVersionsFailure: function() {
      // XXX: handle getting versions failure.
    },

    render: function() {
      var charmId = this.props.charmId;
      return (
        <div className="inspector-current-version">
          <div className="inspector-current-version__current">
            Current version:
            <div className="inspector-current-version__current-version"
              role="button" tabIndex="0"
              onClick={this._viewCharmDetails.bind(this, charmId)}>
              {charmId}
            </div>
          </div>
          <ul className="inspector-current-version__versions">
            {this.state.versionsList}
          </ul>
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'inspector-change-version-item'
]});
