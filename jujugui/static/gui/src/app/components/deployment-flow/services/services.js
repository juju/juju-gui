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

class DeploymentServices extends React.Component {

  /**
    Generate the list of extra info markup.

    @method _generateExtraInfo
    @returns {Array} A list of elements by service.
  */
  _generateExtraInfo() {
    const props = this.props;
    const changes = props.groupedChanges;
    const infos = {};
    for (let key in changes) {
      const items =
        props
          .generateAllChangeDescriptions(changes[key])
          .map(change =>
            <juju.components.DeploymentChangeItem
              change={change}
              key={change.id}
              showTime={false} />);
      infos[key] =
        <ul className="deployment-services__changes">
          {items}
        </ul>;
    }
    return infos;
  }

  /**
    Generate spend summary.

    @method _generateSpend
    @returns {Object} The spend markup.
  */
  _generateSpend() {
    if (!this.props.withPlans) {
      return;
    }
    return (
      <div className="prepend-seven">
        Maximum monthly spend:&nbsp;
        <span className="deployment-services__max">
          $100
        </span>
      </div>
    );
  }

  render() {
    return (
      <div>
        <juju.components.BudgetTable
          acl={this.props.acl}
          allocationEditable={true}
          charmsGetById={this.props.charmsGetById}
          extraInfo={this._generateExtraInfo()}
          listPlansForCharm={this.props.listPlansForCharm}
          parseTermId={this.props.parseTermId}
          plansEditable={true}
          services={
            Object
              .keys(this.props.groupedChanges)
              .map(this.props.getServiceByName)}
          showExtra={this.props.showChangelogs}
          showTerms={this.props.showTerms}
          withPlans={this.props.withPlans} />
        {this._generateSpend()}
      </div>
    );
  }
};

DeploymentServices.propTypes = {
  acl: React.PropTypes.object.isRequired,
  changesFilterByParent: React.PropTypes.func.isRequired,
  charmsGetById: React.PropTypes.func.isRequired,
  generateAllChangeDescriptions: React.PropTypes.func.isRequired,
  getServiceByName: React.PropTypes.func.isRequired,
  groupedChanges: React.PropTypes.object.isRequired,
  listPlansForCharm: React.PropTypes.func.isRequired,
  parseTermId: React.PropTypes.func.isRequired,
  servicesGetById: React.PropTypes.func.isRequired,
  showChangelogs: React.PropTypes.bool,
  showTerms: React.PropTypes.func,
  withPlans: React.PropTypes.bool
};

YUI.add('deployment-services', function() {
  juju.components.DeploymentServices = DeploymentServices;
}, '0.1.0', {
  requires: [
    'budget-table',
    'deployment-change-item'
  ]
});
