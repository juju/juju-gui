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

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addCharm: React.PropTypes.func.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      changeState: React.PropTypes.func.isRequired,
      charmId: React.PropTypes.string.isRequired,
      getAvailableVersions: React.PropTypes.func.isRequired,
      getCharm: React.PropTypes.func.isRequired,
      getMacaroon: React.PropTypes.func.isRequired,
      service: React.PropTypes.object.isRequired,
      setCharm: React.PropTypes.func.isRequired
    },

    versionsXhr: null,

    /**
      Get the current state.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      return {
        loading: false,
        versionsList: null
      };
    },

    componentDidMount: function() {
      this._getVersions(this.props.charmId);
    },

    componentWillReceiveProps: function(nextProps) {
      this._getVersions(nextProps.charmId);
    },

    componentWillUnmount: function() {
      this.versionsXhr.abort();
    },

    /**
      The callable to be passed to the version item to view the charm details.

      @method _viewCharmDetails
      @param {Object} url The charm url as a window.jujulib.URL instance.
      @param {Object} evt The click event.
    */
    _viewCharmDetails: function(url, evt) {
      this.props.changeState({store: url.path()});
    },

    /**
      The callable to be passed to the version item to change versions.

        @method _versionButtonAction
        @param {String} charmId The charm id.
        @param {Object} e The click event.
    */
    _versionButtonAction: function(charmId, e) {
      // In Juju 2.0+ we have to add the charm before we set it. This is just
      // good practice for 1.25.
      // TODO frankban: add support for fetching delegatable macaroons that can
      // be used to add private charms.
      this.props.addCharm(charmId, null,
        this._addCharmCallback.bind(this, charmId), {
          // XXX hatch: the ecs doesn't yet support addCharm so we are going to
          // send the command to juju immedaitely.
          immediate: true
        });
    },

    /**
      Callback for handling the results of addCharm.

      @method _addCharmCallback
      @param {String} charmId The charm id.
      @param {Object} data The response object from the addCharm call in the
        format {err, url}.
    */
    _addCharmCallback: function(charmId, data) {
      var error = data.err;
      if (error) {
        this._addFailureNotification(charmId, error);
        return;
      }
      this.props.setCharm(this.props.service.get('id'), charmId, false, false,
          this._setCharmCallback.bind(this, charmId));
    },

    /**
      Callback for handling the results of setCharm.

      @method _setCharmCallback
    */
    _setCharmCallback: function(charmId, data) {
      if (data.err) {
        this._addFailureNotification(charmId, data.err);
        return;
      }
      this.props.getCharm(charmId, this._getCharmCallback.bind(this, charmId));
    },

    /**
      Callback for handling the results of getCharm.

      @method _getCharmCallback
    */
    _getCharmCallback: function(charmId, data) {
      if (data.err) {
        this._addFailureNotification(charmId, data.err);
        return;
      }
      this.props.service.set('charm', charmId);
    },

    /**
      Add a notification for an upgrade failure.

      @method _addFailureNotification
      @param {String} charmId The charm id.
      @param {Object} error The upgrade error.
    */
    _addFailureNotification: function(charmId, error) {
      this.props.addNotification({
        title: 'Charm upgrade failed',
        message: 'The charm ' + charmId + ' failed to upgrade:' + error,
        level: 'error'
      });
    },

    /**
      Get a list of versions for the charm.

      @method _getVersions
      @param {String} charmId The charm id.
    */
    _getVersions: function(charmId) {
      this.setState({loading: true});
      this.versionsXhr = this.props.getAvailableVersions(
          charmId, this._getVersionsCallback);
    },

    /**
      Update the state with the returned versions.

      @method _getVersionsSuccess
      @param {String} error The error message, if any. Null if no error.
      @param {Array} versions The available versions.
    */
    _getVersionsCallback: function(error, versions) {
      if (error) {
        console.error(error);
        versions = null;
      }
      let components = [];
      if (!versions || versions.length === 1) {
        components = <li className="inspector-change-version__none">
              No other versions found.
            </li>;
      } else {
        const url = window.jujulib.URL.fromLegacyString(this.props.charmId);
        versions.forEach(function(version) {
          const versionURL = window.jujulib.URL.fromLegacyString(version);
          let downgrade = false;
          if (versionURL.revision === url.revision) {
            return true;
          } else if (versionURL.revision < url.revision) {
            downgrade = true;
          }
          components.push(
            <juju.components.InspectorChangeVersionItem
              acl={this.props.acl}
              key={version}
              downgrade={downgrade}
              itemAction={this._viewCharmDetails.bind(this, versionURL)}
              buttonAction={this._versionButtonAction.bind(this, version)}
              url={versionURL}
            />);
        }, this);
      }
      this.setState({loading: false});
      this.setState({versionsList: components});
    },

    /**
      Display the versions list or a spinner if it is loading.

      @method _displayVersionsList
    */
    _displayVersionsList: function(loading, versionsList) {
      if (loading) {
        return(
          <div className="inspector-spinner">
            <juju.components.Spinner />
          </div>
        );
      } else {
        return (
          <ul className="inspector-change-version__versions">
            {versionsList}
          </ul>
        );
      }
    },

    render: function() {
      const url = window.jujulib.URL.fromLegacyString(this.props.charmId);
      return (
        <div className="inspector-change-version">
          <div className="inspector-change-version__current">
            Current version:
            <div className="inspector-change-version__current-version"
              role="button" tabIndex="0"
              onClick={this._viewCharmDetails.bind(this, url)}>
              {url.path()}
            </div>
          </div>
          {this._displayVersionsList(this.state.loading,
              this.state.versionsList)}
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'inspector-change-version-item',
  'loading-spinner'
]});
