/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

class InspectorExposeUnit extends React.Component {
  /**
    Don't bubble the click event to the parent.

    @method _stopBubble
    @param {Object} The click event.
  */
  _stopBubble(e) {
    e.stopPropagation();
  }

  /**
    Build a HTML list from an array of ports and an IP address.

    @method _getAddressList
    @param {String} address An IP address.
    @param {Array} portRanges A list of port ranges.
    @returns {String} HTML of list
  */
  _getAddressList(address, portRanges) {
    if (!portRanges || !portRanges.length || !address) {
      return (
        <div className="inspector-expose__unit-detail">
          No public address
        </div>);
    }
    const items = portRanges.map(portRange => {
      if (portRange.single) {
        const port = portRange.from;
        const label = `${address}:${port}`;
        const protocol = port === 443 ? 'https' : 'http';
        const href = `${protocol}://${label}`;
        return (
          <li className="inspector-expose__item" key={href}>
            <a href={href}
              onClick={this._stopBubble.bind(this)}
              target="_blank">
              {label}
            </a>
          </li>
        );
      }
      const range = `${portRange.from}-${portRange.to}`;
      const label = `${address}:${range}/${portRange.protocol}`;
      return (
        <li className="inspector-expose__item" key={label}>
          <span>{label}</span>
        </li>
      );
    });
    return <ul className="inspector-expose__unit-list">{items}</ul>;
  }

  render() {
    var unit = this.props.unit;
    var publicList = this._getAddressList(
      unit.public_address, unit.portRanges);
    return (
      <li className="inspector-expose__unit" data-id={unit.id} onClick={this.props.action}
        role="button"
        tabIndex="0">
        <div className="inspector-expose__unit-detail">
          {unit.displayName}
        </div>
        {publicList}
      </li>
    );
  }
};

InspectorExposeUnit.propTypes = {
  action: PropTypes.func.isRequired,
  unit: PropTypes.object.isRequired
};

module.exports = InspectorExposeUnit;
