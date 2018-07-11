/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const ButtonDropdown = require('../../button-dropdown/button-dropdown');
const GenericButton = require('../../generic-button/generic-button');
const MachineUnit = require('../machine-unit/machine-unit');

class Machine extends React.Component {
  /**
    Generate the hardware/constraints for a machine.
    @returns {Object} the machine hardware elements.
  */
  _generateHardware() {
    const { hardware } = this.props;
    if (!hardware) {
      return null;
    }
    const items = hardware.map((item, i) => {
      return (
        <li className="machine__hardware-item six-col"
          key={item.label + item.value + i}>
          <span className="machine__hardware-item-label">
            {item.label}
          </span>
          <span className="machine__hardware-item-value">
            {item.value}
          </span>
        </li>);
    });
    return (
      <ul className="machine__hardware twelve-col">
        {items}
      </ul>);
  }

  /**
    Generate the unit icons for the machine.
    @returns {Object} the unit elements.
  */
  _generateUnits() {
    const { isContainer, units } = this.props;
    if (!units || !units.length) {
      return null;
    }
    const menuItems = isContainer ? [{
      label: 'Destroy',
      action: () => {}
    }] : null;
    const components = [];
    units.forEach(unit => {
      components.push(
        <MachineUnit
          icon={unit.icon}
          key={unit.id}
          menuItems={menuItems}
          name={unit.name}
          status={unit.status} />);
    });
    return (
      <ul className="machine__units">
        {components}
      </ul>);
  }

  /**
    Generate the classes for the machine.
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    const { isContainer, machine } = this.props;
    const classes = {
      'machine--uncommitted': machine.deleted || machine.commitStatus === 'uncommitted',
      'machine--root': machine.root
    };
    return classNames(
      'machine-view__machine',
      this.props.classes,
      classes,
      `machine--${isContainer ? 'container' : 'machine'}`
    );
  }

  /**
    Generate a SSH button if the action is provided.
    @returns {Object} The button JSX.
  */
  _generateTerminalButton() {
    const { sshAction } = this.props;
    if (!sshAction) {
      return null;
    }
    return (
      <GenericButton
        action={this.props.sshAction}>
        SSH to machine
      </GenericButton>);
  }

  /**
    Generate a context menu if required.
    @returns {Object} The menu JSX.
  */
  _generateMenu() {
    const { menuItems } = this.props;
    if (!menuItems) {
      return null;
    }
    return (
      <ButtonDropdown
        classes={['machine__dropdown']}
        listItems={menuItems} />);
  }

  render() {
    const { machine } = this.props;
    return (
      <div className={this._generateClasses()}
        onClick={this.props.onClick}
        role="button"
        tabIndex="0">
        {this._generateMenu()}
        <div className="machine__name">
          {machine.name}
        </div>
        {this._generateTerminalButton()}
        {this._generateHardware()}
        {this._generateUnits()}
        {this.props.children}
        <div className="machine__drop-target">
          <div className="machine__drop-message">
            Add to {machine.name}
          </div>
        </div>
      </div>
    );
  }
};

Machine.propTypes = {
  children: PropTypes.any,
  classes: PropTypes.arrayOf(PropTypes.string),
  hardware: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired
  })),
  isContainer: PropTypes.bool,
  machine: PropTypes.shape({
    name: PropTypes.string.isRequired,
    root: PropTypes.bool,
    region: PropTypes.string,
    status: PropTypes.string.isRequired
  }).isRequired,
  menuItems: PropTypes.array,
  onClick: PropTypes.func,
  sshAction: PropTypes.func,
  units: PropTypes.arrayOf(PropTypes.shape({
    icon: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired
  }))
};

module.exports = Machine;
