/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

YUI.add('deployment-component', function() {

  juju.components.Deployment = React.createClass({
    propTypes: {
      activeComponent: React.PropTypes.string,
      autoPlaceUnits: React.PropTypes.func.isRequired,
      changeDescriptions: React.PropTypes.array.isRequired,
      changeState: React.PropTypes.func.isRequired,
      ecsClear: React.PropTypes.func.isRequired,
      ecsCommit: React.PropTypes.func.isRequired,
      getUnplacedUnitCount: React.PropTypes.func.isRequired,
    },

    /**
      Generate the content for the active panel.

      @method _generateActivePanel
      @return {Object} The markup for the panel content.
    */
    _generateActivePanel: function() {
      switch (this.props.activeComponent) {
        case 'summary':
          return (
            <juju.components.DeploymentSummary
              autoPlaceUnits={this.props.autoPlaceUnits}
              changeDescriptions={this.props.changeDescriptions}
              changeState={this.props.changeState}
              ecsClear={this.props.ecsClear}
              ecsCommit={this.props.ecsCommit}
              getUnplacedUnitCount={this.props.getUnplacedUnitCount} />);
      }
    },

    render: function() {
      // TODO: return the old summary component if we're not using the sax feature flag.
      var activeComponent = this.props.activeComponent;
      var activeChild = this._generateActivePanel();
      var steps = [{
        title: 'Deploy',
        active: activeComponent === 'summary'
      }];
      return (
        <juju.components.DeploymentPanel
          changeState={this.props.changeState}
          steps={steps}
          visible={!!activeComponent}>
          {activeChild}
        </juju.components.DeploymentPanel>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-panel',
    'deployment-summary'
  ]
});
