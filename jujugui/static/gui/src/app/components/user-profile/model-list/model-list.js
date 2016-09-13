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

YUI.add('user-profile-model-list', function() {

  juju.components.UserProfileModelList = React.createClass({
    // broadcastStatus is necessary for communicating loading status back to
    // the parent SectionLoadWatcher.
    propTypes: {
      addNotification: React.PropTypes.func.isRequired,
      broadcastStatus: React.PropTypes.func,
      canCreateNew: React.PropTypes.bool.isRequired,
      controllerAPI: React.PropTypes.object.isRequired,
      currentModel: React.PropTypes.string,
      gisf: React.PropTypes.bool,
      hideConnectingMask: React.PropTypes.func.isRequired,
      listModels: React.PropTypes.func.isRequired,
      showConnectingMask: React.PropTypes.func.isRequired,
      switchModel: React.PropTypes.func.isRequired,
      user: React.PropTypes.object,
      users: React.PropTypes.object.isRequired
    },

    getInitialState: function() {
      this.xhrs = [];

      return {
        modelList: [],
        loadingModels: false,
      };
    },

    getDefaultProps: function() {
      // Just in case broadcastStatus isn't passed in (e.g., in tests), calls
      // to it should not fail, so default to an empty function.
      return {
        broadcastStatus: function() {},
        gisf: false
      };
    },

    componentWillMount: function() {
      this._fetchModels();
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    componentWillReceiveProps: function(nextProps) {
      const props = this.props;
      const currentUser = props.user && props.user.user;
      const nextUser = nextProps.user && nextProps.user.user;
      if (nextUser !== currentUser) {
        this._fetchModels();
      }
    },

    /**
      Makes a request of JIMM or JES to fetch the user's availble models.

      @method _fetchModels
    */
    _fetchModels:  function() {
      this.props.broadcastStatus('starting');
      // Delay the call until after the state change to prevent race
      // conditions.
      this.setState({loadingModels: true}, () => {
        const xhr = this.props.listModels(this._fetchModelsCallback);
        this.xhrs.push(xhr);
      });
    },

    /**
      Callback for the JIMM and JES list models call.

      @method _fetchModelsCallback
      @param {String} error The error from the request, or null.
      @param {Object} data The data from the request.
    */
    _fetchModelsCallback: function(error, data) {
      this.setState({loadingModels: false}, () => {
        const broadcastStatus = this.props.broadcastStatus;
        // We need to coerce error types returned by JES vs JIMM into one error.
        const err = (data && data.err) || error;
        if (err) {
          broadcastStatus('error');
          console.error(err);
          return;
        }
        // data.models is only populated by Juju controllers, when using JIMM
        // the models are in the top level 'data' object.
        let modelList;
        if (data.models) {
          modelList = data.models.map(function(model) {
            // XXX frankban: owner should be the ownerTag without the 'user-'
            // prefix here.
            model.owner = model.ownerTag;
            return model;
          });
        } else if (data.map) {
          modelList = data.map(function(model) {
            // XXX kadams54: JIMM models don't *currently* have a name or owner.
            // They have a path which is a combination of both, but that format
            // may change on down the road. Hence this big comment.
            model.name = model.path;
            model.owner = model.path.split('/')[0];
            model.lastConnection = 'N/A';
            // XXX frankban: does JIMM provide lifecycle indications?
            model.isAlive = true;
            return model;
          });
        }
        if (!modelList || !modelList.length || modelList.length === 0) {
          broadcastStatus('empty');
        } else {
          broadcastStatus('ok');
        }
        this.setState({modelList: modelList});
      });
    },

    /**

      Take the supplied UUID, fetch the username and password then call the
      passed in switchModel method. If the UUID and name are null, simply
      disconnect without reconnecting to a new model.

      @method switchModel
      @param {String} uuid The model UUID.
      @param {String} name The model name.
      @param {Function} callback The function to be called once the model has
        been switched and logged into. Takes the following parameters:
        {Object} env The env that has been switched to.
    */
    switchModel: function(uuid, name, callback) {
      this.props.switchModel(uuid, this.state.modelList, name, callback);
    },

    /**
      Generate the details for the provided model.

      @method _generateRow
      @param {Object} model A model object.
      @returns {Array} The markup for the row.
    */
    _generateRow: function(model) {
      const uuid = model.uuid;
      const isCurrent = uuid === this.props.currentModel;
      if (!model.isAlive) {
        if (model.name) {
          return (
            <li className="user-profile__entity user-profile__list-row"
              key={uuid}>
              {model.name} is being destroyed.
            </li>);
        } else {
          return null;
        }
      }
      const lastConnection = model.lastConnection || '--';
      return (
        <juju.components.UserProfileEntity
          entity={model}
          expanded={isCurrent}
          key={uuid}
          switchModel={this.switchModel}
          type="model">
          <span className="user-profile__list-col three-col">
            {model.name || '--'}
          </span>
          <span className="user-profile__list-col four-col">
            --
          </span>
          <span className="user-profile__list-col two-col">
            <juju.components.DateDisplay
              date={lastConnection}
              relative={true} />
          </span>
          <span className="user-profile__list-col one-col">
            --
          </span>
          <span className="user-profile__list-col two-col last-col">
            {model.owner || '--'}
          </span>
        </juju.components.UserProfileEntity>);
    },

    /**
      Generate the header for the models.

      @method _generateHeader
      @returns {Array} The markup for the header.
    */
    _generateHeader: function() {
      return (
        <li className="user-profile__list-header twelve-col">
          <span className="user-profile__list-col three-col">
            Name
          </span>
          <span className="user-profile__list-col four-col">
            Credential
          </span>
          <span className="user-profile__list-col two-col">
            Last accessed
          </span>
          <span className="user-profile__list-col one-col">
            Units
          </span>
          <span className={
            'user-profile__list-col two-col last-col'}>
            Owner
          </span>
        </li>);
    },

    render: function() {
      if (this.state.loadingModels) {
        return (
          <div className="user-profile__model-list twelve-col">
            <juju.components.Spinner />
          </div>
        );
      }
      const list = this.state.modelList;
      if (!list || list.length === 0) {
        return null;
      }
      const rows = list.map(this._generateRow);
      const props = this.props;
      let createNewButton;
      if (props.canCreateNew) {
        createNewButton = (
          <juju.components.CreateModelButton
            addNotification={props.addNotification}
            controllerAPI={props.controllerAPI}
            gisf={props.gisf}
            hideConnectingMask={props.hideConnectingMask}
            showConnectingMask={props.showConnectingMask}
            switchModel={this.switchModel}
            user={props.user} />
        );
      }
      return (
        <div className="user-profile__model-list">
          <div className="user-profile__header twelve-col no-margin-bottom">
            Models
            <span className="user-profile__size">
              ({list.length})
            </span>
            {createNewButton}
          </div>
          <ul className="user-profile__list twelve-col">
            {this._generateHeader()}
            {rows}
          </ul>
        </div>
      );
    }

  });

}, '', {
  requires: [
    'create-model-button',
    'generic-button',
    'generic-input',
    'loading-spinner',
    'user-profile-entity'
  ]
});
