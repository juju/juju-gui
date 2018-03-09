/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const shapeup = require('shapeup');

const ButtonRow = require('../../button-row/button-row');

class MachineViewScaleUp extends React.Component {
  /**
    Display a list of applications.

    @method _generateServices
    @returns {Object} A unit list or onboarding.
  */
  _generateServices() {
    const components = [];
    const applications = this.props.dbAPI.applications.toArray();
    applications.forEach(service => {
      if (service.get('subordinate')) {
        return;
      }
      components.push(
        <li className="machine-view__scale-up-unit"
          key={service.get('id')}>
          <img alt={service.get('name')}
            className="machine-view__scale-up-unit-icon"
            src={service.get('icon')} />
          <div className="machine-view__scale-up-unit-name"
            title={service.get('name')}>
            {service.get('name')}
          </div>
          <input
            className="machine-view__scale-up-unit-input"
            disabled={this.props.acl.isReadOnly()}
            min="0"
            placeholder="units"
            ref={'scaleUpUnit-' + service.get('id')}
            step="1"
            type="number" />
        </li>);
    });
    return (
      <ul className="machine-view__scale-up-units">
        {components}
      </ul>);
  }

  /**
    Add units to the applications.

    @method _handleAddUnits
    @param {Object} evt An event object.
  */
  _handleAddUnits(evt) {
    if (evt) {
      evt.preventDefault();
    }
    const re = /(scaleUpUnit-)(.*)/;
    const props = this.props;
    Object.keys(this.refs).forEach(ref => {
      const parts = re.exec(ref);
      if (parts) {
        const application = props.dbAPI.applications.getById(parts[2]);
        props.dbAPI.addGhostAndEcsUnits(application, this.refs[ref].value);
      }
    });
    props.toggleScaleUp();
  }

  render() {
    var buttons = [{
      action: this.props.toggleScaleUp,
      title: 'Cancel',
      type: 'base'
    }, {
      action: this._handleAddUnits.bind(this),
      disabled: this.props.acl.isReadOnly(),
      title: 'Add units',
      type: 'neutral'
    }];
    return (
      <form className="machine-view__scale-up"
        onSubmit={this._handleAddUnits.bind(this)}>
        {this._generateServices()}
        <ButtonRow buttons={buttons} />
      </form>
    );
  }
};

MachineViewScaleUp.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired
  }).frozen.isRequired,
  dbAPI: shapeup.shape({
    addGhostAndEcsUnits: PropTypes.func.isRequired,
    applications: PropTypes.object.isRequired
  }).isRequired,
  toggleScaleUp: PropTypes.func.isRequired
};

module.exports = MachineViewScaleUp;
