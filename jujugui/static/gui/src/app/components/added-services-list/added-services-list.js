/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const AddedServicesListItem = require('./item/item');

class AddedServicesList extends React.Component {
  generateItemList(services) {
    var items = [];
    services.each(service => {
      items.push(
        <AddedServicesListItem
          // We use the 'name' instead of the 'id' here because when a
          // ghost service is added it uses the ghost id structure instead
          // of the final deployed service id structure and we want react
          // to treat them as the same record instead of re-rendering
          // when they key changes.
          changeState={this.props.changeState}
          getUnitStatusCounts={this.props.getUnitStatusCounts}
          hovered={service.get('id') === this.props.hoveredId}
          hoverService={this.props.hoverService}
          key={service.get('name')}
          panToService={this.props.panToService}
          ref={'AddedServicesListItem-' + service.get('id')}
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

module.exports = AddedServicesList;
