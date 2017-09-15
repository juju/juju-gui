/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

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
        var seriesOptions = Object.keys(series).map((key) => {
          return (
            <option value={key} key={key}>
              {series[key].name}
            </option>);
        });
        component = (
          <div>
            <p>Choose a series to deploy this charm</p>
            <select ref="series" defaultValue="trusty"
              className="local-inspector__series"
              disabled={this.props.acl.isReadOnly()}>
              {seriesOptions}
            </select>
          </div>
        );
        break;
      case 'update':
        component = (
          <ul className="local-inspector__list">
            {this._generateServiceList()}
          </ul>
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
            <input type="checkbox" data-id={serviceId}
              disabled={props.acl.isReadOnly()}
              ref={'service-' + serviceId} />
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

    @method _handleUpdate
  */
  _handleUpdate() {
    var refs = this.refs;
    var services = this.props.services;
    var selectedServices = Object.keys(refs).filter((ref) => {
      var input = refs[ref];
      if (ref.split('-')[0] === 'service' && input.checked) {
        return true;
      }
      return false;
    });
    if (selectedServices.length > 0) {
      var serviceList = selectedServices.map((serviceId) => {
        return services.getById(serviceId.split('-')[1]);
      });
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
                <input type="radio" name="action"
                  defaultChecked={localType === 'new'}
                  disabled={isReadOnly}
                  onChange={this._changeActiveComponent.bind(this, 'new')} />
                Deploy local
              </label>
            </li>
            <li>
              <label>
                <input type="radio" name="action"
                  defaultChecked={localType === 'update'}
                  disabled={isReadOnly}
                  onChange={
                    this._changeActiveComponent.bind(this, 'update')} />
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
