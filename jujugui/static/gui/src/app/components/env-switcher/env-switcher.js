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

YUI.add('env-switcher', function() {

  var EnvSwitcher = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      authDetails: React.PropTypes.object,
      changeState: React.PropTypes.func.isRequired,
      environmentName: React.PropTypes.string,
      humanizeTimestamp: React.PropTypes.func.isRequired,
      listModelsWithInfo: React.PropTypes.func,
      switchModel: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      return {
        showEnvList: false,
        envList: []
      };
    },

    componentDidMount: function() {
      this.updateEnvList();
    },

    /**
      Close the switcher when there is a click outside of the component.
      Called by the component wrapper.

      @method handleClickOutside
      @param {Object} e The click event
    */
    handleClickOutside: function(e) {
      this.setState({showEnvList: false});
    },

    /**
      Calls to the environment to list the active environments.

      @method updateEnvList
    */
    updateEnvList: function() {
      this.props.listModelsWithInfo(this._updateModelListCallback);
    },

    /**
      Sets the state with the supplied data from the
      controllerAPI.listModelsWithInfo call.

      @method _updateModelListCallback
      @param {String} err The possible error from the call, or null.
      @param {Array} models The list of models returned by the call.
    */
    _updateModelListCallback: function(err, models) {
      if (err) {
        console.error(err);
        return;
      }
      const modelList = models.filter(model => {
        return model.isAlive;
      });
      this.setState({envList: modelList});
    },

    /**
      Sets the state of the 'showEnvList' property to the inverse of what
      it was.

      @method toggleEnvList
      @param {Object} e The click event.
    */
    toggleEnvList: function(e) {
      e.preventDefault();
      this.updateEnvList();
      this.setState({ showEnvList: !this.state.showEnvList });
    },

    /**
      Sets the state of the 'showEnvList' property to the inverse of what
      it was when <Enter> or <Space> is clicked.

      @method handleKeyToggle
    */
    handleKeyToggle: function(e) {
      var key = e.which || e.keyCode || 0;
      // key === <Enter> or <Space>
      if (key === 13 || key === 32) {
        this.toggleEnvList(e);
      }
    },

    /**
      Hides the model list and calls the switchModel method with the selected
      model.

      @method handleModelClick
      @param {Object} model The model to switch to, with these attributes:
        - name: the model name;
        - id: the model unique identifier;
        - owner: the user owning the model, like "admin" or "who@external".
    */
    handleModelClick: function(model) {
      const props = this.props;
      this.setState({showEnvList: false});
      props.switchModel(model);
    },

    /**
      Returns the environment list components if the showEnvList state property
      is truthy.

      @method environmentList
      @return {Function} The EnvList component.
    */
    environmentList: function() {
      if (this.state.showEnvList) {
        return <juju.components.EnvList
          acl={this.props.acl}
          authDetails={this.props.authDetails}
          changeState={this.props.changeState}
          handleModelClick={this.handleModelClick}
          humanizeTimestamp={this.props.humanizeTimestamp}
          environmentName={this.props.environmentName}
          envs={this.state.envList}
          switchModel={this.props.switchModel}
        />;
      }
    },

    /**
      Generate the toggle state classes based on the props.

      @method _toggleClasses
      @return {String} The collection of class names.
    */
    _toggleClasses: function() {
      return classNames(
        'env-switcher__toggle',
        {
          'is-active': this.state.showEnvList
        }
      );
    },

    render: function() {
      return (
        <div className="env-switcher"
          role="navigation"
          aria-label="Model switcher">
          <div
            className={this._toggleClasses()}
            onClick={this.toggleEnvList}
            onKeyPress={this.handleKeyToggle}
            id="environmentSwitcherToggle"
            role="button"
            tabIndex="0"
            aria-haspopup="true"
            aria-owns="environmentSwitcherMenu"
            aria-controls="environmentSwitcherMenu"
            aria-expanded="false">
            <span className="env-switcher__name">
              {this.props.environmentName}
            </span>
            <juju.components.SvgIcon name="chevron_down_16"
              className="env-switcher__chevron"
              size="16" />
          </div>
          {this.environmentList()}
        </div>
      );
    }
  });

  // Wrap the component to handle clicking outside.
  juju.components.EnvSwitcher = enhanceWithClickOutside(EnvSwitcher);

}, '0.1.0', { requires: [
  'env-list',
  'svg-icon'
] });
