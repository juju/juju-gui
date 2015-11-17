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

YUI.add('inspector-config', function() {

  juju.components.Configuration = React.createClass({
    /**
      Set the intial state.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      return {
        // Have to clone the config so we don't update it via reference.
        serviceConfig: JSON.parse(JSON.stringify(
          this.props.service.get('config'))),
        forceUpdate: false
      };
    },

    shouldComponentUpdate: function(nextProps, nextState) {
      // If the service has changed then the component should update with the
      // new props.
      var forceUpdate = this.state.forceUpdate;
      if (forceUpdate) {
        // Reset the force update flag so it only happens once.
        this.setState({forceUpdate: false});
      }
      return forceUpdate ||
        nextProps.service.get('id') !== this.props.service.get('id');
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState({
        // Have to clone the config so we don't update it via reference.
        serviceConfig: JSON.parse(JSON.stringify(
          nextProps.service.get('config')))
      });
    },

    /**
      Handle applying the uploaded config.

      @method _applyConfig
      @param {Object} config The config to apply.
    */
    _applyConfig: function(config) {
      var charmName = this.props.charm.get('name');
      // The provided YAML must be for the current charm.
      var newConfig = config[charmName];
      if (!newConfig) {
        return;
      }
      var serviceConfig = this.state.serviceConfig;
      Object.keys(newConfig).forEach((key) => {
        if (serviceConfig[key]) {
          serviceConfig[key] = newConfig[key];
        }
      });
      this.setState({forceUpdate: true});
      this.setState({serviceConfig: serviceConfig});
    },

    /**
      Handle uploading the config file.

      @method _openFileDialog
    */
    _importConfig: function() {
      this.props.getYAMLConfig(this.refs.file.files[0], this._applyConfig);
    },

    /**
      Handle opening the file dialog from the hidden file input.

      @method _openFileDialog
    */
    _openFileDialog: function() {
      this.refs.file.click();
    },

    /**
      Handle cancelling the changes and returning to the inspector overview.

      @method _handleCancelChanges
    */
    _handleCancelChanges: function() {
      this.props.changeState({
        sectionA: {
          component: 'inspector',
          metadata: {
            id: this.props.service.get('id'),
            activeComponent: undefined
          }}});
    },

    /**
      Callback handler for clicking the Save config button.

      @method _saveConfig
    */
    _saveConfig: function() {
      var refs = this.refs;
      var configValues = {};
      Object.keys(refs).forEach((ref) => {
        var activeRef = refs[ref];
        // Just in case we ever have any sub components which have refs
        // and aren't a configuration component.
        if (ref.split('-')[0] === 'Config') {
          configValues[activeRef.props.option.key] = activeRef.state.value;
        }
      });
      var changedConfig = this._getChangedValues(configValues);
      // If there are no changed values then don't set the config.
      var size = Object.keys(changedConfig).length;
      if (size > 0) {
        this._setConfig(changedConfig);
      }
    },

    /**
      Given an object of key/value pairs for the configuration values
      this returns a new object with the values which are different from the
      service model.

      @method _getChangedValues
      @param {Object} configValues The values from the configuration UI.
      @returns {Object} The configuration values with new data.
    */
    _getChangedValues: function(configValues) {
      var serviceConfig = this.props.service.get('config');
      var changedValues = {};
      Object.keys(serviceConfig).forEach((key) => {
        if (serviceConfig[key] !== configValues[key]) {
          changedValues[key] = configValues[key];
        }
      });
      return changedValues;
    },

    /**
      Calls the env set config method.

      @method _setConfig
      @param {Object} configValues The configuration values to save.
    */
    _setConfig: function(configValues) {
      this.props.setConfig(
        this.props.service.get('id'),
        configValues,
        null,
        null,
        this._setConfigCallback
      );
    },

    /**
      Callback for the set config environment call.

      @method _setConfigCallback
    */
    _setConfigCallback: function() {
      // TODO
    },

    /**
      Generates the list of elements to render for the config UI.

      @method _generateConfigElements
      @param {Object} serviceConfig The current service config.
      @returns {Array} An array of React components.
    */
    _generateConfigElements: function(serviceConfig) {
      var charmOptions = this.props.charm.get('options');
      // Some charms don't have any options, in this case, just return.
      if (!charmOptions) {
        return (
          <div className="inspector-config--no-config">
            No configuration options.
          </div>);
      }
      var configElements = [];

      Object.keys(charmOptions).forEach((key) => {
        var option = charmOptions[key];
        option.key = key;
        var ref = 'Config-' + key;
        // We use one component for numeric and string values and
        // another for boolean values.
        if (option.type === 'boolean') {
          var label = option.key + ':';
          configElements.push(
              <juju.components.BooleanConfig
                key={ref}
                ref={ref}
                option={option}
                label={label}
                config={serviceConfig[key]} />);
        } else {
          configElements.push(
              <juju.components.StringConfig
                key={ref}
                ref={ref}
                option={option}
                config={serviceConfig[key]} />);
        }
      });
      return configElements;
    },

    render: function() {
      var importButton = [{
        title: 'Import config file',
        action: this._openFileDialog
      }];
      var actionButtons = [{
        title: 'Cancel',
        action: this._handleCancelChanges
      }, {
        title: 'Save changes',
        type: 'confirm',
        action: this._saveConfig
      }];

      return (
        <div className="inspector-config">
         <div className="inspector-config__fields">
            <input type="file" ref="file" className="hidden"
              onChange={this._importConfig} />
            <juju.components.ButtonRow buttons={importButton} />
            {this._generateConfigElements(this.state.serviceConfig)}
          </div>
          <juju.components.ButtonRow buttons={actionButtons} />
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'button-row',
  'string-config',
  'boolean-config'
]});
