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

YUI.add('deployment-services', function() {

  juju.components.DeploymentServices = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      cloud: React.PropTypes.string
    },

    render: function() {
      var disabled = this.props.acl.isReadOnly();
      return (
        <juju.components.DeploymentSection
          completed={false}
          disabled={!this.props.cloud}
          instance="deployment-services"
          showCheck={true}
          title="Services to be deployed">
          <div className="deployment-services__budget">
            <h4>
              Choose your budget
            </h4>
            <div className="deployment-services__budget-form twelve-col">
              <div className="four-col">
                <juju.components.InsetSelect
                  disabled={disabled}
                  label="Budget"
                  options={[{
                    label: 'test budget',
                    value: 'test-budget'
                  }]} />
              </div>
              <div className="three-col">
                <span className="deployment-services__budget-increase link">
                  Increase budget
                </span>
              </div>
            </div>
            <juju.components.BudgetChart />
          </div>
          <div className="deployment-services__plans twelve-col">
            <div className="deployment-services__plans-show-changelog">
              <juju.components.GenericButton
                action={() => {}}
                type="neutral"
                title="Show change log" />
            </div>
            <h4>
              Confirm services and plans
            </h4>
            <juju.components.BudgetTable
              acl={this.props.acl} />
            <div className="prepend-seven">
              Maximum monthly spend:&nbsp;
              <span className="deployment-services__plans-max">
                $100
              </span>
            </div>
          </div>
        </juju.components.DeploymentSection>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'budget-chart',
    'budget-table',
    'deployment-section',
    'generic-button',
    'inset-select'
  ]
});
