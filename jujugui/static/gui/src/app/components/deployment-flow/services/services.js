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
      changesFilterByParent: React.PropTypes.func.isRequired,
      charmsGetById: React.PropTypes.func.isRequired,
      generateAllChangeDescriptions: React.PropTypes.func.isRequired,
      groupedChanges: React.PropTypes.object.isRequired,
      listPlansForCharm: React.PropTypes.func.isRequired,
      parseTermId: React.PropTypes.func.isRequired,
      servicesGetById: React.PropTypes.func.isRequired,
      showChangelogs: React.PropTypes.bool,
      showTerms: React.PropTypes.func,
      withPlans: React.PropTypes.bool
    },

    /**
      Create a list of services from the change set.

      @method _getServices
      @returns {Array} A list of services.
    */
    _getServices: function() {
      var addedServices = this.props.groupedChanges['_deploy'];
      if (!addedServices) {
        return [];
      }
      return Object.keys(addedServices).map((change) => {
        return this.props.servicesGetById(
          addedServices[change].command.options.modelId);
      });
    },

    /**
      Generate the list of extra info markup.

      @method _generateExtraInfo
      @returns {Array} A list of elements by service.
    */
    _generateExtraInfo: function() {
      var addedServices = this.props.groupedChanges['_deploy'] || [];
      var infos = {};
      Object.keys(addedServices).forEach((change) => {
        var serviceId = addedServices[change].command.options.modelId;
        var changeId = addedServices[change].id;
        var changes = this.props.changesFilterByParent(changeId);
        var descriptions = this.props.generateAllChangeDescriptions(changes);
        var items = descriptions.map(change => {
          return (
            <juju.components.DeploymentChangeItem
              change={change}
              key={change.id}
              showTime={false} />);
        });
        infos[serviceId] = (
          <ul className="deployment-services__changes">
            {items}
          </ul>);
      });
      return infos;
    },

    /**
      Generate spend summary.

      @method _generateSpend
      @returns {Object} The spend markup.
    */
    _generateSpend: function() {
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
    },

    render: function() {
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
            services={this._getServices()}
            showExtra={this.props.showChangelogs}
            showTerms={this.props.showTerms}
            withPlans={this.props.withPlans} />
          {this._generateSpend()}
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'budget-table',
    'deployment-change-item'
  ]
});
