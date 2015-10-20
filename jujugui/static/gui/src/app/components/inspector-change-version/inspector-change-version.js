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
      this._getVersions();
    },

    /**
      The callable to be passed to the version item to change versions.

      @method _versionItemAction
      @param {Object} e The click event.
    */
    _versionItemAction: function(e) {
      console.log('view version');
    },

    /**
      The callable to be passed to the version item to view the charm details.

      @method _versionButtonAction
      @param {Object} e The click event.
    */
    _versionButtonAction: function(e) {
      console.log('change version');
    },

    /**
      Get a list of versions for the charm.

      @method _getVersions
    */
    _getVersions: function() {
      this.props.getAvailableVersions(this.props.charmId,
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
      versions.forEach(function(version) {
        components.push(
          <juju.components.InspectorChangeVersionItem
            key={version}
            downgrade={false}
            itemAction={this._versionItemAction}
            buttonAction={this._versionButtonAction}
            id={version} />);
      }, this);
      this.setState({versionsList: components});
    },

    /**
      Handle failures in getting versions.

      @method _getVersionsFailure
    */
    _getVersionsFailure: function() {
      // XXX: handle getting versions failure.
    },

    render: function() {
      return (
        <div className="inspector-current-version">
          <div className="inspector-current-version__current">
            Current version:
            <div className="inspector-current-version__current-version">
              {this.props.charmId}
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
