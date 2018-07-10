/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const ButtonDropdown = require('../../button-dropdown/button-dropdown');

class MachineUnit extends React.Component {
  /**
    Generate the classes for the unit.
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    const status = `machine-unit--${this.props.status}`;
    return classNames('machine-unit', status);
  }

  render() {
    let menu;
    let title;
    const { name, menuItems } = this.props;
    if (menuItems) {
      title = name;
      menu = menuItems ? (
        <ButtonDropdown
          listItems={menuItems} />) : null;
    }
    return (
      <li className={this._generateClasses()}>
        <span className="machine-unit__icon">
          <img alt={name}
            className="machine-unit__icon-img"
            src={this.props.icon}
            title={name} />
        </span>
        {title}
        {menu}
      </li>
    );
  }
};

MachineUnit.propTypes = {
  icon: PropTypes.string.isRequired,
  menuItems: PropTypes.array,
  name: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired
};

module.exports = MachineUnit;
