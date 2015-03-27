/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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


YUI.add('change-version-view-jsx', function(Y) {

  var ns = Y.namespace('juju.viewlets');

  ns.ChangeVersionList = React.createClass({
    render: function() {
      var items = [];
      if (this.props.available_versions) {
        this.props.available_versions.forEach(function(version) {
          items.push(<ns.ChangeVersionItem version={version} />)
        });
      }
      return (
        <div>
          // Note JSX is not HTML, to set classes you use the jsdom api key
          // className.
          <div className="unit-list-header">
            <div className="change-version-close link">
              <i className="sprite close-inspector-click"></i>
            </div>
            Change version
          </div>
          <ul className="unit-list">
            {items}
          </ul>
        </div>
      );
    }
  });

  ns.ChangeVersionItem = React.createClass({
    render: function() {
      var id = this.props.version,
          strippedId = id.replace('cs:', '');
      return (
        <li>
          <a href={strippedId}>{id}</a>
          <a className="upgrade-link right-link" data-upgradeto={id}>Upgrade</a>
        </li>
      );
    }
  });

});
