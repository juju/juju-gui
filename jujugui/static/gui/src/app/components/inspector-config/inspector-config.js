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

    _importConfig: function() {},
    _resetValues: function() {},

    /**
      Callback handler for clicking the Save config button.

      @method _saveConfig
    */
    _saveConfig: function() {
      var refs = this.refs;
      var configValues = {};
      Object.keys(refs).forEach((ref) => {
        // Just in case we ever have any sub components which have refs
        // and aren't a configuration component.
        var isConfig = ref.split('-')[0] === 'Config';
        if (isConfig) {
          var value;
          if (refs[ref].state) {
            value = refs[ref].state.value;
          }
          configValues[refs[ref].props.option.key] = value;
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
      @returns {Array} An array of React components.
    */
    _generateConfigElements: function() {
      var charmOptions = this.props.charm.get('options');
      var serviceConfig = this.props.service.get('config');
      var configElements = [];
      Object.keys(charmOptions).forEach((key) => {
        var option = charmOptions[key];
        option.key = key;
        var ref = 'Config-' + key;
        // We use one component for numeric and string values and
        // another for boolean values.
        if (option.type === 'boolean') {
          configElements.push(
              <juju.components.BooleanConfig
                key={ref}
                ref={ref}
                option={option}
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
          action: this._importConfig
      }];
      var actionButtons = [{
        title: 'Cancel',
        action: this._resetValues
      }, {
        title: 'Save changes',
        type: 'save-changes',
        action: this._saveConfig
      }];

      var configElements = this._generateConfigElements();

      return (
        <div className="inspector-config">
          <juju.components.ButtonRow buttons={importButton} />
          {configElements}
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
