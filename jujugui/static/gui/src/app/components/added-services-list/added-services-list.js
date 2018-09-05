/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const AddedServicesListItem = require('./item/item');

class AddedServicesList extends React.Component {
  generateItemList() {
    const { applications, units } = this.props.entities;
    let items = [];
    Object.keys(applications).forEach(key => {
      const application = applications[key];
      items.push(
        <AddedServicesListItem
          application={application}
          // We use the 'name' instead of the 'id' here because when a
          // ghost service is added it uses the ghost id structure instead
          // of the final deployed service id structure and we want react
          // to treat them as the same record instead of re-rendering
          // when they key changes.
          changeState={this.props.changeState}
          hovered={application.id === this.props.hoveredId}
          key={application.name}
          ref={'AddedServicesListItem-' + application.id}
          serviceModule={this.props.serviceModule}
          units={units} />);
    });
    return items;
  }

  render() {
    return (
      <div className="inspector-view">
        <ul className="added-services-list inspector-view__list">
          {this.generateItemList()}
        </ul>
      </div>
    );
  }
};

AddedServicesList.propTypes = {
  changeState: PropTypes.func.isRequired,
  entities: shapeup.shape({
    applications: PropTypes.object.isRequired,
    units: PropTypes.object.isRequired,
    reshape: shapeup.reshapeFunc
  }),
  hoveredId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]),
  serviceModule: shapeup.shape({
    hoverService: PropTypes.func.isRequired,
    panToService: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc
  })
};

module.exports = AddedServicesList;
