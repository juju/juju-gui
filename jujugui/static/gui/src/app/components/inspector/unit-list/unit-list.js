/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const ButtonRow = require('../../button-row/button-row');
const CheckListItem = require('../../check-list-item/check-list-item');
const OverviewAction = require('../overview-action/overview-action');

class UnitList extends React.Component {
  constructor() {
    super();
    this.state = {activeCount: 0};
  }

  /**
    Fires changeState to update the UI based on the component clicked.

    @method _navigate
    @param {Object} e The click event.
  */
  _navigate(e) {
    this.props.changeState({
      gui: {
        inspector: {
          id: this.props.service.get('id'),
          activeComponent: 'scale'
        }}});
  }

  /**
    Sets the selectAll state property based on the "select all" child
    component.

    @method _selectAllUnits
    @param {String} group The key for a group of checkboxes.
    @param {Boolean} checked Whether the "select all" child component is
      checked.
  */
  _selectAllUnits(group, checked) {
    var refs = this.refs;
    var setChecked = (key, groups) => {
      groups[key].units.forEach(unit => {
        refs['CheckListItem-' + unit.id].setState({
          checked: checked
        }, () => {
          // After the state has been updated then update the active unit
          // count to enable/disable the buttons.
          this._updateActiveCount();
        });
      });
    };
    if (checked === undefined) {
      checked = false;
    }
    var groups = this._generateGroups();
    if (group === null) {
      for (var key in groups) {
        setChecked(key, groups);
        var groupSelectAll = refs[key];
        if (groupSelectAll.state.checked !== checked) {
          groupSelectAll.setState({checked: checked});
        }
      }
    } else {
      setChecked(group, groups);
    }
  }

  /**
    The callable to be passed to the unit items for navigating to the unit
    details.

    @method _unitItemAction
    @param {Object} e The click event.
  */
  _unitItemAction(e) {
    var unitParts = e.currentTarget.getAttribute('data-id').split('/');
    this.props.changeState({
      gui: {
        inspector: {
          // This is done in parts like this because subordinate units show
          // the service unit that it's placed on, not the subordinate itself.
          id: unitParts[0], // Service Id
          unit: unitParts[1], // Unit Id
          activeComponent: 'unit'
        }
      }
    });
  }

  /**
    Update the selected units with the supplied action.

    @method _handleUpdateUnits
    @param {String} action The action to apply to the units.
  */
  _handleUpdateUnits(action) {
    let unitNames = [];
    const units = this.props.units;
    const refs = this.refs;
    const envResolved = this.props.envResolved;
    Object.keys(refs).forEach(function(ref) {
      let isInstance = ref.split('-')[0] === 'CheckListItem';
      if (isInstance && refs[ref].state.checked) {
        let unitName = ref.slice(ref.indexOf('-') + 1);
        unitNames.push(unitName);
        const unit = units.find(u => u.id === unitName);
        // If the unit does not have an agent_status, it is not committed,
        // bail early to prevent superfluous RPC/ECS
        if (!unit.agent_status) {
          return;
        }
        // On resolve and remove we want to mark the unit as resolved else
        // Juju won't remove units that are in error. This applies only to
        // committed units.
        if (action === 'resolve' || action === 'remove') {
          envResolved(unitName, null, false);
        } else if (action === 'retry') {
          envResolved(unitName, null, true);
        }
      }
    });
    if (action === 'remove') {
      this.props.destroyUnits(unitNames);
    }
    this._selectAllUnits(null, false);
  }

  /**
    Generates a list of unit components.

    @method _generateUnitList
    @param {Object} group A definition for a group of checkboxes .
    @returns {Array} Collection of unit components.
  */
  _generateUnitList(group) {
    var key = group.key;
    var unitList = [
      <CheckListItem
        aside={group.count + ''}
        className='select-all'
        disabled={this.props.acl.isReadOnly()}
        key={key}
        label={group.label}
        ref={key}
        whenChanged={this._selectAllUnits.bind(this, key)} />
    ];
    group.units.forEach(unit => {
      var ref = 'CheckListItem-' + unit.id;
      unitList.push(
        <CheckListItem
          action={this._unitItemAction.bind(this)}
          disabled={this.props.acl.isReadOnly()}
          extraInfo={unit.workloadStatusMessage}
          id={unit.id}
          key={unit.displayName}
          label={unit.displayName}
          ref={ref}
          whenChanged={this._updateActiveCount.bind(this)} />);
    });
    return unitList;
  }

  /**
    Generate the groups of units for the service.

    @method _generateGroups
    @returns {Object} The groups of units for the service.
  */
  _generateGroups() {
    var units = this.props.units;
    var groups = {};
    var unitStatus = this.props.unitStatus;
    if (unitStatus === 'error') {
      var errors = {};
      units.forEach(function(unit) {
        var agentState = unit.agent_state_info;
        if (!errors[agentState]) {
          errors[agentState] = [];
        }
        errors[agentState].push(unit);
      });
      Object.keys(errors).forEach(function(error, i) {
        var key = 'select-all-' + i;
        groups[key] = {
          label: error,
          units: errors[error],
          count: errors[error].length,
          key: key
        };
      });
    } else {
      var key = 'select-all';
      var status = unitStatus || 'all';
      groups[key] = {
        label: `Select ${status} units`,
        units: units,
        count: units.length,
        key: key
      };
    }
    return groups;
  }

  /**
    Generate the groups of units.

    @method _generateListGroups
    @returns {Object} The list components
  */
  _generateListGroups() {
    if (this.props.units.length === 0) {
      return (
        <div className="unit-list__message">
          No units for this application. Scale to add units.
        </div>);
    }
    var components = [];
    var groups = this._generateGroups();
    Object.keys(groups).forEach(function(key) {
      var group = groups[key];
      components = components.concat(this._generateUnitList(group));
    }, this);
    return (
      <ul className="unit-list__units">
        {components}
      </ul>);
  }

  /**
    Update the count of the number of active checkboxes.

    @method _updateActiveCount
  */
  _updateActiveCount() {
    var activeCount = 0;
    var refs = this.refs;
    Object.keys(refs).forEach(ref => {
      if (ref.split('-')[0] === 'CheckListItem') {
        if (refs[ref].state.checked) {
          activeCount += 1;
        }
      }
    });
    this.setState({'activeCount': activeCount});
  }

  /**
    Generate the buttons for the status.

    @method _generateButtons
    @returns {Array} The list of buttons
  */
  _generateButtons() {
    if (this.props.units.length === 0) {
      return;
    }
    var buttons = [];
    var disabled = this.state.activeCount === 0 ||
      this.props.acl.isReadOnly();
    if (this.props.unitStatus === 'error') {
      buttons.push({
        title: 'Resolve',
        type: 'neutral',
        action: this._handleUpdateUnits.bind(this, 'resolve'),
        disabled: disabled
      });
      buttons.push({
        title: 'Retry',
        type: 'neutral',
        action: this._handleUpdateUnits.bind(this, 'retry'),
        disabled: disabled
      });
    }
    buttons.push({
      title: 'Remove',
      type: 'neutral',
      action: this._handleUpdateUnits.bind(this, 'remove'),
      disabled: disabled
    });
    return (
      <ButtonRow
        buttons={buttons} />);
  }

  /**
    Generate the scale service action.

    @method _generateScaleService
    @returns {Object} The scale service component.
  */
  _generateScaleService() {
    // Don't show the scale service if we're viewing a status list (e.g.
    // errors) or if the service is a subordinate.
    if (this.props.unitStatus || this.props.service.get('subordinate') ||
        this.props.acl.isReadOnly()) {
      return;
    }
    return (
      <div className="unit-list__actions">
        <OverviewAction
          action={this._navigate.bind(this)}
          icon="plus_box_16"
          title="Scale application" />
      </div>);
  }

  render() {
    return (
      <div className="unit-list">
        {this._generateScaleService()}
        {this._generateListGroups()}
        {this._generateButtons()}
      </div>
    );
  }
};

UnitList.propTypes = {
  acl: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  destroyUnits: PropTypes.func.isRequired,
  envResolved: PropTypes.func.isRequired,
  service: PropTypes.object.isRequired,
  unitStatus: PropTypes.string,
  units: PropTypes.array.isRequired
};

module.exports = UnitList;
