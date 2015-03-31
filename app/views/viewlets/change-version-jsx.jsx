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
    // React is not MVC use utility classes and pass them into views.
    // If it doesn't involve the UI do not put it in the component.
    _upgradeService: function(upgradeTo) {
      var props = this.props,
          env = props.viewletManager.env,
          setCharm = env.setCharm;
      setCharm.call(env, props.model.id, upgradeTo, false);
    },

    render: function() {
      var items = [],
          availableVersions = this.props.model.available_versions;
      if (availableVersions) {
        availableVersions.forEach(function(version) {
          items.push(<ns.ChangeVersionItem version={version} upgradeService={this._upgradeService} />)
        }, this);
      }
      // Note JSX is not HTML, to set classes you use the jsdom api key
      // className.
      return (
        <div>
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
    _handleUpgradeService: function() {
      var props = this.props;
      props.upgradeService(props.version);
    },

    render: function() {
      var id = this.props.version,
          href = '/' + id.replace('cs:', '');
      // Note JSX is not HTML, to attach event handlers you use the jsdom api
      // key on the element. React then creates a single delegate on the
      // container and listens for the click events to bubble up. This does
      // not create an 'onClick' string on the element in the DOM.
      return (
        <li>
          <a href={href}>{id}</a>
          <a className="upgrade-link right-link" onClick={this._handleUpgradeService} data-upgradeto={id}>Upgrade</a>
        </li>
      );
    }
  });

});
