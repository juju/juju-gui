/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

YUI.add('budget-table-row', function() {

  juju.components.BudgetTableRow = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      allocationEditable: React.PropTypes.bool,
      extraInfo: React.PropTypes.object,
      listPlansForCharm: React.PropTypes.func,
      plansEditable: React.PropTypes.bool,
      service: React.PropTypes.object.isRequired,
      showExtra: React.PropTypes.bool,
      withPlans: React.PropTypes.bool
    },

    plansXHR: null,

    getInitialState: function() {
      return {
        editAllocation: false,
        expanded: false,
        plansLoading: false,
        plans: []
      };
    },

    componentWillMount: function() {
      this._getPlans();
    },

    componentWillUnmount: function() {
      if (this.plansXHR) {
        this.plansXHR.abort();
      }
    },

    /**
      Get the list of plans available for the service.
      @method _getPlans
    */
    _getPlans: function() {
      this.setState({plansLoading: true}, () => {
        this.plansXHR = this.props.listPlansForCharm(
          this.props.service.get('charm'), this._getPlansCallback);
      });
    },

    /**
      Callback for when plans for an entity have been successfully fetched.

      @method _getPlansCallback
      @param {String} error An error message, or null if there's no error.
      @param {Array} plans A list of the plans found.
    */
    _getPlansCallback: function(error, plans) {
      if (error) {
        console.error('Fetching plans failed: ' + error);
      } else {
        this.setState({
          plansLoading: false,
          plans: plans
        });
      }
    },

    /**
     Toggle the expanded state.

     @method _toggle
    */
    _toggle: function() {
      this.setState({expanded: !this.state.expanded});
    },

    /**
     Toggle the allocation field state.

     @method _toggleAllocation
    */
    _toggleAllocation: function() {
      this.setState({editAllocation: !this.state.editAllocation});
    },

    /**
     Generate the change plan form.

     @method _generatePlans
     @returns {Object} The plan form.
    */
    _generatePlans: function() {
      var disabled = this.props.acl.isReadOnly();
      var plans = this.state.plans.map((plan, i) => {
        return (
          <li className="budget-table__plan twelve-col"
            key={i}>
            <div className="six-col">
              <h4>{plan.url}</h4>
              <p>{plan.description}</p>
            </div>
            <div className="two-col">
              {plan.price}
            </div>
            <div className="two-col">
              Recommended allocation: $550.
            </div>
            <div className="two-col last-col">
              <juju.components.GenericButton
                action={this._toggle}
                disabled={disabled}
                type="neutral"
                title="Select plan" />
            </div>
          </li>);
      });
      return (
        <ul className="budget-table__plans twelve-col no-margin-bottom">
          {plans}
        </ul>);
    },

    /**
     Generate the change plan form.

     @method _generateChangePlan
     @returns {Object} The plan form.
    */
    _generateChangePlan: function() {
      if (!this.props.plansEditable ||
          this.state.plans && this.state.plans.length === 0) {
        return;
      }
      return (
        <div>
          <div className="budget-table__current twelve-col no-margin-bottom">
            {this._generateSharedFields()}
          </div>
          {this._generatePlans()}
          <p className="budget-table__plan-notice twelve-col">
            By setting an allocation and selecting a plan you agree to the
            plans terms and conditions
          </p>
        </div>);
    },

    /**
     Generate the edit button if editable.

     @method _generateEdit
     @returns {Object} The edit component.
    */
    _generateEdit: function() {
      if (!this.props.plansEditable || this.state.plans.length === 0) {
        return;
      }
      var disabled = this.props.acl.isReadOnly();
      return (
        <div className="two-col last-col no-margin-bottom">
          <div className="budget-table__edit">
            <juju.components.GenericButton
              action={this._toggle}
              disabled={disabled}
              type="neutral"
              title="Change plan" />
          </div>
        </div>);
    },

    /**
     Generate the input or display for the allocation.

     @method _generateAllocation
     @returns {Object} The allocation markup.
    */
    _generateAllocation: function() {
      if (this.props.allocationEditable && this.state.editAllocation) {
        return (
          <input className="budget-table-row__allocation-input"
            type="text"
            value="$1" />);
      } else {
        return (
          <span onClick={
            this.props.allocationEditable ? this._toggleAllocation : undefined}>
            $1
          </span>);
      }
    },

    /**
     Generate the shared fields.

     @method _generateSharedFields
     @returns {Object} The fields markup.
    */
    _generateSharedFields: function() {
      var service = this.props.service;
      return (
        <div>
          <div className="three-col no-margin-bottom">
            <img className="budget-table__charm-icon"
              src={service.get('icon')} />
            {service.get('name')}
          </div>
          <div className="one-col no-margin-bottom">
            {service.get('unit_count')}
          </div>
        </div>);
    },

    /**
      Generate the details for the selected plan.

      @method _generateSelectedPlan
      @returns {Object} The plan markup.
    */
    _generateSelectedPlan: function() {
      var service = this.props.service;
      var activePlan = service.get('activePlan');
      if (activePlan) {
        return (
          <span>
            {activePlan.url} ({activePlan.price})
          </span>);
      } else if (this.state.plans.length > 0) {
        return (
          <span>
            You need to select a plan
          </span>);
      } else {
        return (
          <span>
            -
          </span>);
      }
    },

    /**
      Generate the extra info section.

      @method _generateExtra
      @returns {Object} The extra info markup.
    */
    _generateExtra: function() {
      if (!this.props.showExtra) {
        return;
      }
      return (
        <div className="twelve-col no-margin-bottom">
          {this.props.extraInfo}
        </div>);
    },

    /**
      Generate plan cols.

      @method _generatePlanCols
      @returns {Object} The plan cols markup.
    */
    _generatePlanCols: function() {
      if (!this.props.withPlans) {
        return;
      }
      const plansEditable = this.props.plansEditable;
      const editableWidth = !plansEditable ? 'two-col' : 'one-col';
      return (
        <div>
          <div className="three-col no-margin-bottom">
            {this._generateSelectedPlan()}
          </div>
          <div className={editableWidth + ' no-margin-bottom'}>
            $1
          </div>
          <div className={editableWidth + ' no-margin-bottom'}>
            {this._generateAllocation()}
          </div>
          <div className={
            'one-col no-margin-bottom' + (plansEditable ? '' : ' last-col')}>
            $1
          </div>
          {this._generateEdit()}
        </div>
      );
    },

    render: function() {
      var classes = {
        'budget-table-row': true,
        'twelve-col': true
      };
      return (
        <juju.components.ExpandingRow
          classes={classes}
          clickable={false}
          expanded={this.state.expanded}>
          <div>
            {this._generateSharedFields()}
            {this._generatePlanCols()}
            {this._generateExtra()}
          </div>
          <div>
            {this._generateChangePlan()}
          </div>
        </juju.components.ExpandingRow>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'expanding-row',
    'generic-button'
  ]
});
