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
      allocationEditable: React.PropTypes.bool,
      plansEditable: React.PropTypes.bool,
      services: React.PropTypes.array.isRequired
    },

    /**
     Generate the list of services.

     @method _generateServices
     @returns {Array} The list of services.
    */
    _generateServices: function() {
      return this.props.services.map((service, i) => {
        return (
          <juju.components.BudgetTableRow
            acl={this.props.acl}
            key={i}
            allocationEditable={this.props.allocationEditable}
            plansEditable={this.props.plansEditable}
            service={service} />);
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
    'budget-table-row'
  ]
});
