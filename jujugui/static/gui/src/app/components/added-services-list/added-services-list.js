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

YUI.add('added-services-list', function() {

  juju.components.AddedServicesList = React.createClass({

    generateItemList: function(services) {
      var items = [];
      services.forEach(function(service) {
        items.push(
            <juju.components.AddedServicesListItem
              service={service} />);
      });
      return items;
    },

    render: function() {
      return (
        <ul className="added-services-list">
          {this.generateItemList(this.props.services)}
        </ul>
      );
    }

  });

}, '0.1.0', { requires: [
  'added-services-list-item'
]});
