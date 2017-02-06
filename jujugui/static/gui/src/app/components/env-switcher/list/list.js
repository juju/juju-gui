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
      authDetails: React.PropTypes.object,
      envs: React.PropTypes.array.isRequired,
      handleEnvClick: React.PropTypes.func.isRequired,
      showProfile: React.PropTypes.func.isRequired
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
        return (
          <li className="env-list__environment" key="none">
            No models available, click below to view your profile and create a
            new model.
          </li>
        );
      }
      const auth = this.props.authDetails;
      const currentUser = auth ? auth.user : null;
      return models.map(model => {
        let name = model.name;
        let owner = model.owner;
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
            onClick={this._handleModelClick}
            key={model.uuid}>
            {name}
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
      this.props.handleEnvClick({
        id: currentTarget.getAttribute('data-id'),
        name: currentTarget.getAttribute('data-name')
      });
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
      const auth = this.props.authDetails;
      let buttonRow;
      if (auth && auth.rootUserName) {
        const buttons = [{
          title: 'Profile',
          type: 'neutral',
          action: () => {
            this.props.showProfile(auth.rootUserName);
          }
        }];
        buttonRow = <juju.components.ButtonRow buttons={buttons} />;
      }
      return (
        <juju.components.Panel
          instanceName="env-list-panel"
          visible={true}>
          {this._generateModels()}
          {buttonRow}
        </juju.components.Panel>
      );
    }
  });

}, '0.1.0', { requires: [
  'button-row',
  'panel-component'
]});
