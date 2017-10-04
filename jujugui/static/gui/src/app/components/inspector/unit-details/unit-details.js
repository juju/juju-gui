/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const ButtonRow = require('../../button-row/button-row');

class UnitDetails extends React.Component {
  /**
    Handle removing a unit if the button has been clicked.

    @method _handleRemoveUnit
  */
  _handleRemoveUnit() {
    this.props.destroyUnits([this.props.unit.id]);
    // Navigate to the unit list for the unit's service.
    this.props.changeState({
      gui: {
        inspector: {
          id: this.props.service.get('id'),
          activeComponent: this.props.previousComponent || 'units',
          unitStatus: this.props.unitStatus,
          unit: null
        }}});
  }

  /**
    Build a HTML list from an array of port ranges and an IP address.

    @param {String} address An IP address.
    @param {Array} portRanges A list of port ranges, each one being an object
      with the following attributes:
        - from: the initial port;
        - to: the last port in the range;
        - single: whether from === to (meaning it's not really a range);
        - protocol: the IP protocol (like "tcp").
    @param {Boolean} clickabl Whether the addresses are clickable.
    @returns {String} HTML of list.
  */
  _generateAddresses(address, portRanges, clickable) {
    if (!address) {
      return;
    }
    const createItem = (label, href) => {
      let link = <span>{label}</span>;
      if (href) {
        link = <a href={href} target="_blank">{label}</a>;
      }
      return <li className="unit-details__list-item" key={label}>{link}</li>;
    };
    if (!portRanges || !portRanges.length) {
      return (
        <ul className="unit-details__list">{createItem(address, '')}</ul>
      );
    }
    const items = portRanges.map(portRange => {
      if (portRange.single) {
        const port = portRange.from;
        const label = `${address}:${port}`;
        if (!clickable) {
          return createItem(label, '');
        }
        const protocol = port === 443 ? 'https' : 'http';
        const href = `${protocol}://${label}`;
        return createItem(label, href);
      }
      const range = `${portRange.from}-${portRange.to}`;
      const label = `${address}:${range}/${portRange.protocol}`;
      return createItem(label, '');
    });
    return <ul className="unit-details__list">{items}</ul>;
  }

  /**
    Build a HTML block of statuses for the given unit.

    @param {Object} unit The unit model instance.
    @returns {String} The node with the statuses.
  */
  _generateStatuses(unit) {
    if (!unit.agent_state) {
      return <p className="unit-details__property">Status: uncommitted</p>;
    }
    let msg = unit.agent_state;
    if (unit.workloadStatusMessage) {
      msg = `${msg} - ${unit.workloadStatusMessage}`;
    }
    let agent = null;
    if (unit.agentStatus) {
      agent = (
        <p className="unit-details__property">
          Agent Status: {unit.agentStatus}
        </p>
      );
    }
    let workload = null;
    if (unit.workloadStatus) {
      workload = (
        <p className="unit-details__property">
          Workload Status: {unit.workloadStatus}
        </p>
      );
    }
    return (
      <div>
        <p className="unit-details__property">Status: {msg}</p>
        {agent}
        {workload}
      </div>
    );
  }

  render() {
    const props = this.props;
    const unit = props.unit;
    const buttons = [{
      disabled: props.acl.isReadOnly(),
      title: 'Remove',
      action: this._handleRemoveUnit.bind(this)
    }];
    const privateList = this._generateAddresses(
      unit.private_address, unit.portRanges, true);
    const publicList = this._generateAddresses(
      unit.public_address, unit.portRanges, props.service.get('exposed'));
    return (
      <div className="unit-details">
        <div className="unit-details__properties">
          {this._generateStatuses(unit)}
          <p className="unit-details__property">
            Public addresses: {publicList ? null : 'none'}
          </p>
          {publicList}
          <p className="unit-details__property">
            IP addresses: {privateList ? null : 'none'}
          </p>
          {privateList}
        </div>
        <ButtonRow
          buttons={buttons} />
      </div>
    );
  }
};

UnitDetails.propTypes = {
  acl: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  destroyUnits: PropTypes.func.isRequired,
  previousComponent: PropTypes.string,
  service: PropTypes.object.isRequired,
  unit: PropTypes.object.isRequired,
  unitStatus: PropTypes.string
};

module.exports = UnitDetails;
