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

const DeploymentChanges = React.createClass({
  displayName: 'DeploymentChanges',

  propTypes: {
    generateAllChangeDescriptions: React.PropTypes.func.isRequired,
    getCurrentChangeSet: React.PropTypes.func.isRequired
  },

  getInitialState: function() {
    return {
      changes: this.props.getCurrentChangeSet()
    };
  },

  render: function() {
    const state = this.state;
    return (
      <juju.components.ExpandingRow
        classes={{'twelve-col': true}}
        clickable={true}>
        <div>
          Show changes ({Object.keys(state.changes).length})
          &rsaquo;
        </div>
        <ul className="deployment-changes">
          {this.props.generateAllChangeDescriptions(state.changes)
            .map(change => (
              <juju.components.DeploymentChangeItem
                change={change}
                key={change.id}
                showTime={false} />))}
        </ul>
      </juju.components.ExpandingRow>
    );
  }

});

YUI.add('deployment-changes', function() {
  juju.components.DeploymentChanges = DeploymentChanges;
}, '0.1.0', {
  requires: [
    'deployment-change-item',
    'expanding-row'
  ]
});
