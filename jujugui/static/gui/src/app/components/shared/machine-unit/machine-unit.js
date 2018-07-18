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
    return classNames('machine-unit', status, this.props.classes);
  }

  render() {
    let menu;
    let title;
    const { name, menuItems } = this.props;
    if (menuItems) {
      title = (
        <span className="machine-unit__name">
          {name}
        </span>);
      menu = menuItems ? (
        <ButtonDropdown
          classes={['machine-unit__dropdown']}
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
  classes: PropTypes.arrayOf(PropTypes.string),
  icon: PropTypes.string.isRequired,
  menuItems: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    action: PropTypes.func
  })),
  name: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired
};

module.exports = MachineUnit;
