/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const BooleanConfig = require('../../boolean-config/boolean-config');
const StringConfig = require('../../string-config/string-config');
const ButtonRow = require('../../button-row/button-row');

class Configuration extends React.Component {
  constructor(props) {
    super(props);
    this.originalSeries = this.props.service.get('series');
    this.state = {
      // Have to clone the config so we don't update it via reference.
      serviceConfig: this._clone(this.props.service.get('config')),
      series: this.props.service.get('series'),
      changed: false
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      // Have to clone the config so we don't update it via reference.
      serviceConfig: this._clone(nextProps.service.get('config'))
    });
  }

  /**
    Clone an object.

    @method _clone
    @param {Object} obj The object to clone.
    @returns {Object} the cloned object.
  */
  _clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
    Handle field value changes.

    @method _handleOnChange
  */
  _handleOnChange() {
    let changed = false;
    const serviceName = this.refs.ServiceName;
    if (serviceName && this.props.service.get('name') !==
      serviceName.getValue()) {
      changed = true;
    } else if (this.state.series !== this.originalSeries) {
      changed = true;
    } else if (Object.keys(this._getChangedConfig()).length > 0) {
      changed = true;
    }
    this.setState({changed: changed});
  }

  /**
    Handle applying the uploaded config.

    @method _applyConfig
    @param {Object} config The config to apply.
  */
  _applyConfig(config) {
    var charmName = this.props.charm.get('name');
    // The provided YAML must be for the current charm.
    var newConfig = config[charmName];
    if (!newConfig) {
      return;
    }
    var serviceConfig = this.state.serviceConfig;
    Object.keys(newConfig).forEach(key => {
      if (serviceConfig[key]) {
        serviceConfig[key] = newConfig[key];
      }
    });
    this.setState({serviceConfig: serviceConfig});
  }

  /**
    Handle uploading the config file.

    @method _openFileDialog
  */
  _importConfig() {
    this.props.getYAMLConfig(
      this.refs.file.files[0], this._applyConfig.bind(this));
    // Reset the form so the file can be uploaded again
    this.refs['file-form'].reset();
    this._handleOnChange();
  }

  /**
    Handle opening the file dialog from the hidden file input.

    @method _openFileDialog
  */
  _openFileDialog() {
    this.refs.file.click();
  }

  /**
    Return to the inspector overview.

    @method _showInspectorIndex
  */
  _showInspectorIndex() {
    this.props.changeState({
      gui: {
        inspector: {
          id: this.props.service.get('id'),
          activeComponent: undefined
        }}});
  }

  /**
    Callback handler for clicking the Save config button.

    @method _saveConfig
  */
  _saveConfig() {
    // The service name component is only shown if it's a ghost service.
    var serviceName = this.refs.ServiceName;
    var props = this.props;
    if (serviceName) {
      var service = props.service;
      var nameValue = serviceName.getValue();
      var serviceExists = props.getServiceByName(nameValue);
      // We want to allow them to set it to itself.
      if (service.get('name') !== nameValue && serviceExists !== null) {
        // The service already exists so bail out.
        props.addNotification({
          title: 'Invalid application name',
          message: `An application with the name "${nameValue}" already ` +
            'exists.',
          level: 'error'
        });
        return;
      }
      if (!window.jujulib.isValidName(nameValue)) {
        props.addNotification({
          title: 'Invalid application name',
          message: 'Invalid application name.',
          level: 'error'
        });
        return;
      }
      service.set('name', nameValue);
      props.updateServiceUnitsDisplayname(service.get('id'));
    }
    const changedConfig = this._getChangedConfig();
    // If there are no changed values then don't set the config.
    if (Object.keys(changedConfig).length > 0) {
      props.setConfig(props.service.get('id'),
        changedConfig,
        this._setConfigCallback.bind(this)
      );
    }
    this._showInspectorIndex();
  }

  /**
    Get the config values that have changed from the model.

    @method _getChangedConfig
    @returns {Object} The configuration values with new data.
  */
  _getChangedConfig() {
    var refs = this.refs;
    var configValues = {};
    Object.keys(refs).forEach(ref => {
      var activeRef = refs[ref];
      // Just in case we ever have any sub components which have refs
      // and aren't a configuration component.
      if (ref.split('-')[0] === 'Config') {
        configValues[activeRef.getKey()] = activeRef.getValue();
      }
    });
    return this._getChangedValues(configValues);
  }

  /**
    Given an object of key/value pairs for the configuration values
    this returns a new object with the values which are different from the
    service model.

    @method _getChangedValues
    @param {Object} configValues The values from the configuration UI.
    @returns {Object} The configuration values with new data.
  */
  _getChangedValues(configValues) {
    var serviceConfig = this.props.service.get('config');
    var changedValues = {};
    Object.keys(serviceConfig).forEach(key => {
      const existingValue = serviceConfig[key] || '';
      const configValue = configValues[key] || '';
      if (existingValue.toString() !== configValue.toString()) {
        changedValues[key] = configValues[key];
      }
    });
    return changedValues;
  }

  /**
    Callback for the set config environment call.

    @method _setConfigCallback
  */
  _setConfigCallback() {
    // TODO
  }

  /**
    Generates the list of elements to render for the config UI.

    @method _generateConfigElements
    @returns {Array} An array of React components.
  */
  _generateConfigElements() {
    var disabled = this.props.acl.isReadOnly();
    var serviceConfig = this.state.serviceConfig;
    var charmOptions = this.props.charm.get('options');
    // Some charms don't have any options, in this case, just return.
    if (!charmOptions) {
      return (
        <div className="inspector-config--no-config">
          No configuration options.
        </div>);
    }
    var configElements = [];

    Object.keys(charmOptions).forEach(key => {
      // Clone the options so that we're not updating the stored options.
      const option = this._clone(charmOptions[key]);
      option.key = key;
      option.description = this.props.linkify(option.description);
      const ref = 'Config-' + key;
      // We use one component for numeric and string values and
      // another for boolean values.
      if (option.type === 'boolean') {
        const label = option.key + ':';
        configElements.push(
          <BooleanConfig
            config={serviceConfig[key]}
            disabled={disabled}
            key={ref}
            label={label}
            onChange={this._handleOnChange.bind(this)}
            option={option}
            ref={ref} />);
      } else {
        configElements.push(
          <StringConfig
            config={serviceConfig[key]}
            disabled={disabled}
            key={ref}
            onChange={this._handleOnChange.bind(this)}
            option={option}
            ref={ref} />);
      }
    });
    return configElements;
  }

  /**
    If this is a ghost service then show the ability to customize the
    service name.

    @method _customizeServiceName
    @return {Object} The input to render or not.
  */
  _customizeServiceName() {
    var id = this.props.service.get('id');
    // If it contains a $ at the end it's a ghost service so we allow them
    // to change the name.
    if (id.match(/\$$/)) {
      return (<StringConfig
        config={this.props.service.get('name')}
        disabled={this.props.acl.isReadOnly()}
        onChange={this._handleOnChange.bind(this)}
        option={{
          key: 'Application name',
          description: 'Specify a custom application name. The application' +
            ' name cannot be changed once it has been deployed.'
        }}
        ref="ServiceName" />);
    }
    return;
  }

  /**
    Handle updating state to properly update the components. If units were
    already placed but not yet deployed then call to unplace them and
    navigate to the machine view.

    @method _handleSeriesChange
    @param {Object} e The change event.
  */
  _handleSeriesChange(e) {
    const props = this.props;
    // Defining `value` outside of the setState callback is required.
    const value = e.currentTarget.value;
    const service = props.service;
    const unplacedUnits = props.unplaceServiceUnits(service.get('id'));
    service.set('series', value);
    this.setState({series: value}, () => {
      this._handleOnChange();
    });
    // If units were unplaced then we want to show a notification and
    // open up the machine view for the user.
    const unplacedUnitsLength = unplacedUnits.length;
    if (unplacedUnitsLength > 0) {
      props.addNotification({
        title: `${unplacedUnitsLength} units unplaced`,
        message: 'The ' + unplacedUnitsLength + ' placed units for ' +
          service.get('name') + ' have been unplaced.',
        level: 'error'
      });
      props.changeState({
        gui: {
          machines: ''
        }});
    }
  }

  /**
    If the application is from a multi-series charm and has not yet been
    deployed then this will be a select element for the user to configure
    which series to use.

    @method _generateMultiSeriesSelector
  */
  _generateMultiSeriesSelector() {
    const series = this.props.charm.get('series');
    const hasRelations = this.props.serviceRelations.length > 0;
    if (!this.props.service.get('pending') || !Array.isArray(series)) {
      // If the application is deployed or if it's not a multi-series
      // charm then nothing needs to happen here.
      return;
    }

    const classes = classNames(
      'inspector-config__select',
      {
        'inspector-config__select--changed':
          this.state.series !== this.originalSeries
      });
    return (
      <div className="inspector-config__series-select">
        <span>Choose Series</span>
        <select
          className={classes}
          disabled={hasRelations}
          onChange={this._handleSeriesChange.bind(this)}
          title={
            hasRelations ? 'The series for this subordinate has been set ' +
            'to the application it is related to.' : undefined}
          value={this.state.series}>
          {series.map(name =>
            <option key={name} value={name}>{name}</option>)}
        </select>
        <span className="inspector-config__series-select-description">
          Choose the series to deploy. This cannot be
          changed once the application is deployed.
        </span>
      </div>);
  }

  /**
    Display the save buttons if there are changes.

    @method _generateButtons
  */
  _generateButtons() {
    const disabled = this.props.acl.isReadOnly();
    const actionButtons = [{
      disabled: disabled,
      title: 'Cancel',
      type: 'base',
      action: this._showInspectorIndex.bind(this)
    }, {
      disabled: disabled,
      title: 'Save changes',
      type: 'neutral',
      action: this._saveConfig.bind(this)
    }];
    const classes = classNames(
      'inspector-config__buttons',
      {'inspector-config__buttons--hidden': !this.state.changed});
    return (
      <div className={classes}>
        <ButtonRow buttons={actionButtons} />
      </div>);
  }

  render() {
    var disabled = this.props.acl.isReadOnly();
    var importButton = [{
      disabled: disabled,
      title: 'Import config file',
      action: this._openFileDialog.bind(this)
    }];
    return (
      <div className="inspector-config">
        <div className="inspector-config__fields">
          {this._customizeServiceName()}
          {this._generateMultiSeriesSelector()}
          <form ref="file-form">
            <input
              className="hidden"
              disabled={disabled}
              onChange={this._importConfig.bind(this)}
              ref="file"
              type="file" />
          </form>
          <div className="inspector-config__config-file">
            <ButtonRow buttons={importButton} />
          </div>
          {this._generateConfigElements()}
        </div>
        {this._generateButtons()}
      </div>
    );
  }
};

Configuration.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  charm: PropTypes.object.isRequired,
  getServiceByName: PropTypes.func.isRequired,
  getYAMLConfig: PropTypes.func.isRequired,
  linkify: PropTypes.func.isRequired,
  service: PropTypes.object.isRequired,
  serviceRelations: PropTypes.array.isRequired,
  setConfig: PropTypes.func.isRequired,
  unplaceServiceUnits: PropTypes.func.isRequired,
  updateServiceUnitsDisplayname: PropTypes.func.isRequired
};

module.exports = Configuration;
