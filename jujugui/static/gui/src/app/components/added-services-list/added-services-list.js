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

YUI.add('added-services-list', function() {

  juju.components.AddedServicesList = React.createClass({

    generateItemList: function(services) {
      var items = [];
      services.forEach((service) => {
        items.push(
            <juju.components.AddedServicesListItem
              // We use the 'name' instead of the 'id' here because when a
              // ghost service is added it uses the ghost id structure instead
              // of the final deployed service id structure and we want react
              // to treat them as the same record instead of re-rendering
              // when they key changes.
              key={service.get('name')}
              changeState={this.props.changeState}
              service={service} />);
      });
      return items;
    },

    render: function() {
      return (
        <div className="inspector-view">
          <ul className="added-services-list inspector-view__list">
            {this.generateItemList(this.props.services)}
          </ul>
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'added-services-list-item'
]});
