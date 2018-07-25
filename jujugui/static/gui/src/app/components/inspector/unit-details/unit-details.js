/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const ButtonRow = require('../../button-row/button-row');
const Link = require('../../link/link');
const SvgIcon = require('../../svg-icon/svg-icon');

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
    Generate the state to open the terminal and run debug-hooks on the unit.
  */
  _generateDebugHooksState() {
    const unit = this.props.unit;
    let commands = [`juju debug-hooks ${unit.id}`];
    return { terminal: commands };
  }

  /**
    Generate the state to open the terminal and SSH to the unit.
    @params cmds {Array} An array of commands (as strings) to be executed after
      sshing to the unit.
  */
  _generateSshToUnitState(cmds) {
    const unit = this.props.unit;
    let commands = [`juju ssh ${unit.id}`];
    cmds.forEach(cmd => commands.push(cmd));
    return { terminal: commands };
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
      let link = (<span>{label}</span>);
      if (href) {
        link = (
          <a className="unit-details__address-link"
            href={href}
            target="_blank">
            {label}
          </a>);
      }
      return (
        <li className="unit-details__action-list-item"
          key={label}>
          {link}
        </li>);
    };
    if (!portRanges || !portRanges.length) {
      return (
        <ul className="unit-details__action-list">
          {createItem(address, '')}
        </ul>);
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
    return (
      <ul className="unit-details__action-list">
        {items}
      </ul>);
  }

  /**
    Generate a formatted list.

    @param items {Array} The items to build the list from.
    @returns {Object} The list JSX.
  */
  _generateList(items) {
    const list = items.map((item, i) => (
      <li className="twelve-col unit-details__list-item"
        key={item.label + item.value + i}>
        <div className="four-col prepend-one no-margin-bottom unit-details__label">
          {item.label}
        </div>
        <div className="seven-col last-col no-margin-bottom">
          {item.value}
        </div>
      </li>
    ));
    return (
      <ul className="twelve-col unit-details__list">
        {list}
      </ul>);
  }

  /**
    Build a HTML block of statuses for the given unit.

    @returns {Object} The status list JSX.
  */
  _generateStatuses() {
    const { unit } = this.props;
    let statuses = [];
    if (!unit.agent_state) {
      statuses.push({
        label: 'uncommitted'
      });
    } else {
      statuses.push({
        label: unit.agent_state,
        value: unit.workloadStatusMessage
      });
      if (unit.agentStatus) {
        statuses.push({
          label: 'Agent',
          value: unit.agentStatus
        });
      }
      if (unit.workloadStatus) {
        statuses.push({
          label: 'Workload',
          value: unit.workloadStatus
        });
      }
    }
    return this._generateList(statuses);
  }

  /**
    Generate the list of addresses for the uni.
    @returns {Object} The address list JSX.
  */
  _generateAddressList() {
    const { unit } = this.props;
    const privateList = this._generateAddresses(
      unit.private_address, unit.portRanges, true);
    const publicList = this._generateAddresses(
      unit.public_address, unit.portRanges, this.props.service.get('exposed'));
    let addresses = [{
      label: 'Public',
      value: publicList || 'none'
    }, {
      label: 'IP(s)',
      value: privateList || 'none'
    }];
    return this._generateList(addresses);
  }

  /**
     Generates a row of buttons to be used on a unit in error.

     The buttons are only generated if the unit is in error and jujushell is
     enabled, otherwise it returns nothing.
     @returns {Array} The actions list.
   */
  _generateErrorButtons() {
    const props = this.props;
    const unit = props.unit;
    if (unit.agent_state !== 'error' || !props.showSSHButtons) {
      return [];
    }
    return [{
      title: 'Tail logs',
      state: this._generateSshToUnitState(
        [`sudo tail -f /var/log/juju/unit-${unit.urlName}.log`])
    }, {
      title: 'Debug hooks',
      state: this._generateDebugHooksState()
    }];
  }

  /**
     Generates a list of actions to interact with the terminal.
     @returns {Object} The actions JSX.
   */
  _generateTerminalActions() {
    if (!this.props.showSSHButtons) {
      return null;
    }
    const actions = [{
      title: 'SSH to unit',
      state: this._generateSshToUnitState(
        [`cd /var/lib/juju/agents/unit-${this.props.unit.urlName}/charm`])
    }].concat(this._generateErrorButtons());
    const links = actions.map(action => (
      <li className="unit-details__action-list-item"
        key={action.title}>
        <Link
          changeState={this.props.changeState}
          clickState={action.state}
          generatePath={this.props.generatePath}>
          {action.title}
        </Link>
      </li>
    ));
    return (
      <div className="unit-details__section twelve-col unit-details__terminal-actions">
        <div className="five-col no-margin-bottom">
          <SvgIcon
            className="machine__ssh-icon"
            name="code-snippet_24"
            size="20" />
        </div>
        <div className="seven-col last-col no-margin-bottom">
          <ul className="unit-details__action-list">
            {links}
          </ul>
        </div>
      </div>);
  }

  render() {
    const props = this.props;
    return (
      <div className="unit-details">
        <div className="unit-details__section twelve-col unit-details__statuses">
          <h5 className="unit-details__title">
            Status
          </h5>
          {this._generateStatuses()}
        </div>
        <div className="unit-details__section twelve-col">
          <h5 className="unit-details__title">
            Adresses
          </h5>
          {this._generateAddressList()}
        </div>
        {this._generateTerminalActions()}
        <div className="twelve-col no-margin-bottom">
          <ButtonRow buttons={[{
            disabled: props.acl.isReadOnly(),
            title: 'Remove',
            action: this._handleRemoveUnit.bind(this)
          }]} />
        </div>
      </div>
    );
  }
};

UnitDetails.propTypes = {
  acl: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  destroyUnits: PropTypes.func.isRequired,
  generatePath: PropTypes.func.isRequired,
  previousComponent: PropTypes.string,
  service: PropTypes.object.isRequired,
  showSSHButtons: PropTypes.bool,
  unit: PropTypes.object.isRequired,
  unitStatus: PropTypes.string
};

module.exports = UnitDetails;
