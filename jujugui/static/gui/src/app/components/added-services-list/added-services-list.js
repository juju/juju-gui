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

class AddedServicesList extends React.Component {
  generateItemList(services) {
    var items = [];
    services.each((service) => {
      items.push(
        <juju.components.AddedServicesListItem
          // We use the 'name' instead of the 'id' here because when a
          // ghost service is added it uses the ghost id structure instead
          // of the final deployed service id structure and we want react
          // to treat them as the same record instead of re-rendering
          // when they key changes.
          key={service.get('name')}
          hovered={service.get('id') === this.props.hoveredId}
          changeState={this.props.changeState}
          getUnitStatusCounts={this.props.getUnitStatusCounts}
          ref={'AddedServicesListItem-' + service.get('id')}
          hoverService={this.props.hoverService}
          panToService={this.props.panToService}
          service={service} />);
    });
    return items;
  }

  render() {
    return (
      <div className="inspector-view">
        <ul className="added-services-list inspector-view__list">
          {this.generateItemList(this.props.services)}
        </ul>
      </div>
    );
  }
};

AddedServicesList.propTypes = {
  changeState: PropTypes.func.isRequired,
  findRelatedServices: PropTypes.func.isRequired,
  findUnrelatedServices: PropTypes.func.isRequired,
  getUnitStatusCounts: PropTypes.func.isRequired,
  hoverService: PropTypes.func.isRequired,
  hoveredId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]),
  panToService: PropTypes.func.isRequired,
  services: PropTypes.object.isRequired,
  updateUnitFlags: PropTypes.func.isRequired
};

YUI.add('added-services-list', function() {
  juju.components.AddedServicesList = AddedServicesList;
}, '0.1.0', { requires: [
  'added-services-list-item'
]});
