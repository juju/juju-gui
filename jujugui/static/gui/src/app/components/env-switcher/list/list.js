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

YUI.add('env-list', function() {

  juju.components.EnvList = React.createClass({

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      authDetails: React.PropTypes.object,
      changeState: React.PropTypes.func.isRequired,
      environmentName: React.PropTypes.string,
      envs: React.PropTypes.array.isRequired,
      handleModelClick: React.PropTypes.func.isRequired,
      humanizeTimestamp: React.PropTypes.func.isRequired,
      switchModel: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      return {
        envs: this.props.envs
      };
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState({envs: nextProps.envs});
    },

    /**
      Generate the elements for the list of models.

      @method generateModelList
    */
    generateModelList: function() {
      const models = this.state.envs;
      if (!models.length) {
        return false;
      }
      const auth = this.props.authDetails;
      const currentUser = auth ? auth.user : null;
      // Remove the 'controller' model from the dropdown list, then sort by
      // last connected (latest at the top).
      // People shouldn't be editing the 'controller' model.
      // They can still access it from their profile page.
      const modelsWithoutController = models.filter(model => {
        return !model.isController &&
          model.name !== this.props.environmentName;
      }).sort((a, b) => {
        return b.lastConnection.getTime() - a.lastConnection.getTime();
      });
      // If there is only one model left and it's the same name as the current
      // environment - remove it.
      if (modelsWithoutController.length === 1 &&
          modelsWithoutController[0].name === this.props.environmentName) {
        return false;
      }
      return modelsWithoutController.map(model => {
        let name = model.name;
        let owner = model.owner;
        const lastConnected = this.props.
          humanizeTimestamp(model.lastConnection);
        let ownerNoDomain;
        if (owner.indexOf('@') === -1) {
          // Juju does not return domains for local owners when listing models.
          ownerNoDomain = owner;
          owner += '@local';
        } else {
          ownerNoDomain = owner.split('@')[0];
        }
        if (owner !== currentUser) {
          name = `${ownerNoDomain}/${model.name}`;
        }
        return (
          <li className="env-list__environment"
            role="menuitem"
            tabIndex="0"
            data-id={model.uuid}
            data-name={model.name}
            data-owner={model.owner}
            onClick={this._handleModelClick}
            key={model.uuid}>
            {name}
            <div className="env-list__last-connected">
              Last accessed {lastConnected}
            </div>
          </li>
        );
      });
    },

    /**
      Handle clicking on a model.

      @method _handleModelClick
      @param {Object} evt The click event.
    */
    _handleModelClick: function(evt) {
      const currentTarget = evt.currentTarget;
      this.props.handleModelClick({
        id: currentTarget.getAttribute('data-id'),
        name: currentTarget.getAttribute('data-name'),
        owner: currentTarget.getAttribute('data-owner')
      });
    },

    /**
      When creating a new model, the dropdown needs to be closed.

      @method _handleNewModelClick
    */
    _handleNewModelClick: function() {
      this.props.handleModelClick();
    },

    /**
      Generate the list of models.

      @method _generateModelList
    */
    _generateModels: function() {
      return (
        <ul className="env-list"
          role="menubar"
          id="environmentSwitcherMenu"
          aria-expanded="true"
          aria-hidden="false"
          aria-labelledby="environmentSwitcherToggle">
          {this.generateModelList()}
        </ul>
      );
    },

    render: function() {
      // TODO frankban: retrieving gisf from the global state is a bad
      // practice and it is only done here as gisf is only required for a bug
      // in the ACL returned by JIMM. Once the bug is fixed, we can remove
      // mentions of gisf here.
      const gisf = window.juju_config && window.juju_config.gisf;
      const canAddModels = !!gisf || this.props.acl.canAddModels();
      const auth = this.props.authDetails;
      let createNew;
      if (auth && auth.rootUserName) {
        createNew = <juju.components.CreateModelButton
          type="neutral"
          title="Start a new model"
          disabled={!canAddModels}
          changeState={this.props.changeState}
          switchModel={this.props.switchModel}
          action={this._handleNewModelClick}
        />;
      }
      return (
        <juju.components.Panel
          instanceName="env-list-panel"
          visible={true}>
          {this._generateModels()}
          {createNew}
        </juju.components.Panel>
      );
    }
  });

}, '0.1.0', { requires: [
  'button-row',
  'panel-component',
  'create-model-button'
]});
