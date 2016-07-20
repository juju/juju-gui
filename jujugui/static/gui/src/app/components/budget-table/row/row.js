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
      plansEditable: React.PropTypes.bool,
      service: React.PropTypes.object.isRequired
    },

    getInitialState: function() {
      return {expanded: false};
    },

    /**
     Toggle the expanded state.

     @method _toggle
    */
    _toggle: function() {
      this.setState({expanded: !this.state.expanded});
    },

    /**
     Generate the change plan form.

     @method _generatePlans
     @returns {Object} The plan form.
    */
    _generatePlans: function() {
      var disabled = this.props.acl.isReadOnly();
      var plans = [{}, {}].map((plan, i) => {
        return (
          <li className="budget-table__plan twelve-col"
            key={i}>
            <div className="six-col">
              <h4>Bronze plan</h4>
              <p>This is the basic support plan.</p>
            </div>
            <div className="two-col">
              5 calls per month
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
      if (!this.props.plansEditable) {
        return;
      }
      return (
        <div>
          <div className="budget-table__current twelve-col no-margin-bottom">
            {this._generateSharedFields()}
          </div>
          {this._generatePlans()}
          <div className="budget-table__plan-notice twelve-col">
            By setting an allocation and selecting a plan you agree to the
            plans terms and conditions
          </div>
        </div>);
    },

    /**
     Generate the edit button if editable.

     @method _generateEdit
     @returns {Object} The edit component.
    */
    _generateEdit: function() {
      if (!this.props.plansEditable) {
        return;
      }
      var disabled = this.props.acl.isReadOnly();
      return (
        <div className="two-col last-col">
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
     Generate the shared fields.

     @method _generateSharedFields
     @returns {Object} The fields markup.
    */
    _generateSharedFields: function() {
      return (
        <div>
          <div className="three-col">
            <img className="budget-table__charm-icon"
              src={
                'https://api.staging.jujucharms.com/charmstore/v4/' +
                'trusty/landscape-server-14/icon.svg'} />
            Landscape
          </div>
          <div className="one-col">
            4
          </div>
        </div>);
    },

    render: function() {
      var plansEditable = this.props.plansEditable;
      var classes = {
        'budget-table__row': true,
        'twelve-col': true
      };
      return (
        <juju.components.ExpandingRow
          classes={classes}
          clickable={false}
          expanded={this.state.expanded}>
          <div>
            {this._generateSharedFields()}
            <div className="three-col">
              You need to choose a plan.
            </div>
            <div className={plansEditable ? 'one-col' : 'two-col'}>
              $1
            </div>
            <div className={plansEditable ? 'one-col' : 'two-col'}>
              $1
            </div>
            <div className="one-col">
              $1
            </div>
            {this._generateEdit()}
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
