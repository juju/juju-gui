/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const ButtonRow = require('../button-row/button-row');
const InspectorHeader = require('../inspector/header/header');

class LocalInspector extends React.Component {
  constructor(props) {
    super(props);
    this.state = this._generateState(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this._generateState(nextProps));
  }

  /**
    Change the state to reflect the chosen component.

    @method _changeActiveComponent
    @param {String} newComponent The component to switch to.
  */
  _changeActiveComponent(newComponent) {
    var nextProps = this.state;
    nextProps.activeComponent = newComponent;
    this.setState(this._generateState(nextProps));
  }

  /**
    Generates the state for the local inspector based on the app state.

    @method _generateState
    @param {Object} nextProps The props which were sent to the component.
    @return {Object} A generated state object which can be passed to setState.
  */
  _generateState(nextProps) {
    return {
      activeComponent: nextProps.activeComponent || nextProps.localType ||
        this.props.localType
    };
  }

  /**
    Generates the active component based on the state.

    @method _generateComponent
    @param {Object} activeComponent The component to display.
    @return {Object} A generated component.
  */
  _generateComponent(activeComponent) {
    var component;
    switch (activeComponent) {
      case 'new':
        var series = this.props.series;
        var seriesOptions = Object.keys(series).map(key => {
          return (
            <option key={key} value={key}>
              {series[key].name}
            </option>);
        });
        component = (
          <div>
            <p>Choose a series to deploy this charm</p>
            <select className="local-inspector__series" defaultValue="trusty"
              disabled={this.props.acl.isReadOnly()}
              ref="series">
              {seriesOptions}
            </select>
          </div>
        );
        break;
      case 'update':
        component = (
          <div>
            <p className="local-inspector__label">Choose applications to upgrade:</p>
            <ul className="local-inspector__list">
              {this._generateServiceList()}
            </ul>
          </div>
        );
        break;
    }
    return component;
  }

  /**
    Generate a list of services

    @method _generateServiceList
  */
  _generateServiceList() {
    var props = this.props;
    var services = props.services.toArray();
    if (services.length === 0) {
      return <li>No existing services</li>;
    }
    var items = [];
    services.forEach(function(service) {
      var serviceId = service.get('id');
      items.push(
        <li key={serviceId}>
          <label>
            <input data-id={serviceId} disabled={props.acl.isReadOnly()}
              ref={'service-' + serviceId}
              type="checkbox" />
            {service.get('name')}
          </label>
        </li>
      );
    });
    return items;
  }

  /**
    Handle closing the local inspector.

    @method _close
  */
  _close() {
    this.props.changeState({
      gui: {
        inspector: null
      }});
  }

  /**
    Handle uploading the charm.

    @method _handleUpload
  */
  _handleUpload() {
    this.props.uploadLocalCharm(this.refs.series.value, this.props.file);
  }

  /**
    Handle updating services.
  */
  _handleUpdate() {
    const refs = this.refs;
    const selectedServices = Object.keys(refs).filter(ref => {
      const input = refs[ref];
      if (ref.split('-')[0] === 'service' && input.checked) {
        return true;
      }
      return false;
    });
    if (selectedServices.length > 0) {
      const serviceList = selectedServices.map(serviceId =>
        this.props.services.getById(serviceId.split('-').splice(1).join('-')));
      this.props.upgradeServiceUsingLocalCharm(serviceList, this.props.file);
      this._close();
    }
  }

  render() {
    var isReadOnly = this.props.acl.isReadOnly();
    var localType = this.props.localType;
    var file = this.props.file;
    var size = (file.size / 1024).toFixed(2);
    var buttons = [{
      title: 'Cancel',
      action: this._close.bind(this),
      type: 'base'
    }, {
      title: 'Upload',
      action: this.state.activeComponent === 'new' ?
        this._handleUpload.bind(this) : this._handleUpdate.bind(this),
      disabled: isReadOnly,
      type: 'neutral'
    }];
    return (
      <div className="inspector-view local-inspector">
        <InspectorHeader
          backCallback={this._close.bind(this)}
          title="Local charm" />
        <div className="inspector-content local-inspector__section">
          <div className="local-inspector__file">
            <p>File: {file.name}</p>
            <p>Size: {size}kb</p>
          </div>
          <ul className="local-inspector__list">
            <li>
              <label>
                <input defaultChecked={localType === 'new'} disabled={isReadOnly}
                  name="action"
                  onChange={this._changeActiveComponent.bind(this, 'new')}
                  type="radio" />
                Deploy local
              </label>
            </li>
            <li>
              <label>
                <input defaultChecked={localType === 'update'} disabled={isReadOnly}
                  name="action"
                  onChange={
                    this._changeActiveComponent.bind(this, 'update')}
                  type="radio" />
                Upgrade local
              </label>
            </li>
          </ul>
          {this._generateComponent(this.state.activeComponent)}
        </div>
        <ButtonRow
          buttons={buttons} />
      </div>
    );
  }
};

LocalInspector.propTypes = {
  acl: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  file: PropTypes.object.isRequired,
  localType: PropTypes.string.isRequired,
  series: PropTypes.object.isRequired,
  services: PropTypes.object.isRequired,
  upgradeServiceUsingLocalCharm: PropTypes.func.isRequired,
  uploadLocalCharm: PropTypes.func.isRequired
};

module.exports = LocalInspector;
