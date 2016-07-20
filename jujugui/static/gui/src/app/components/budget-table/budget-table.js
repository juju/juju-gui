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

YUI.add('budget-table', function() {

  juju.components.BudgetTable = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      plansEditable: React.PropTypes.bool
    },

    /**
     Generate the list of services.

     @method _generateServices
     @returns {Array} The list of services.
    */
    _generateServices: function() {
      var disabled = this.props.acl.isReadOnly();
      var plansEditable = this.props.plansEditable;
      return [1, 2].map((service, i) => {
        var editCol = plansEditable ? (
          <div className="two-col last-col">
            <div className="budget-table__edit">
              <juju.components.GenericButton
                action={() => {}}
                disabled={disabled}
                type="neutral"
                title="Change plan" />
            </div>
          </div>) : undefined;
        return (
          <div className="budget-table__row twelve-col"
            key={i}>
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
            <div className="three-col">
              You need to choose a plan.
            </div>
            <div className={plansEditable ? 'one-col' : 'two-col'}>
            </div>
            <div className={plansEditable ? 'one-col' : 'two-col'}>
            </div>
            <div className="one-col">
            </div>
            {editCol}
          </div>);
      });
    },

    render: function() {
      var plansEditable = this.props.plansEditable;
      return (
        <div className="budget-table">
          <div className="budget-table__row-header twelve-col">
            <div className="three-col">
              Name
            </div>
            <div className="one-col">
              Units
            </div>
            <div className="three-col">
              Details
            </div>
            <div className={plansEditable ? 'one-col' : 'two-col'}>
              Usage
            </div>
            <div className={plansEditable ? 'one-col' : 'two-col'}>
              Allocation
            </div>
            <div className="one-col last-col">
              Spend
            </div>
          </div>
          {this._generateServices()}
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'generic-button'
  ]
});
