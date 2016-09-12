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

YUI.add('deployment-changes', function() {

  juju.components.DeploymentChanges = React.createClass({
    propTypes: {
      changes: React.PropTypes.object.isRequired,
      generateAllChangeDescriptions: React.PropTypes.func.isRequired
    },

    /**
      Generate the list of change items.

      @method _generateChanges
      @returns {Array} A list of change elements.
    */
    _generateChanges: function() {
      const descriptions = this.props.generateAllChangeDescriptions(
        this.props.changes);
      return descriptions.map(change => (
        <juju.components.DeploymentChangeItem
          change={change}
          key={change.id}
          showTime={false} />));
    },

    render: function() {
      return (
        <juju.components.ExpandingRow
          classes={{'twelve-col': true}}
          clickable={true}>
          <div>
            Show changes ({Object.keys(this.props.changes).length})
            &rsaquo;
          </div>
          <ul className="deployment-changes">
            {this._generateChanges()}
          </ul>
        </juju.components.ExpandingRow>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-change-item',
    'expanding-row'
  ]
});
