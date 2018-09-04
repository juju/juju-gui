/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const AddedServicesListItem = require('./item/item');
const AddedServicesLabel = require('./label/label');

const addToObj = (obj, key, value) => {
  if (!obj[key]) {
    obj[key] = [];
  }
  obj[key].push(value);
};

class AddedServicesList extends React.Component {

  /**
    Generate a new AddedServicesListItem component and return it.
    @param {Object} service The service instance to fetch data from.
    @returns {Function} The AddedServicesListItem.
  */
  _newListItem(service) {
    return (
      <AddedServicesListItem
        // We use the 'name' instead of the 'id' here because when a
        // ghost service is added it uses the ghost id structure instead
        // of the final deployed service id structure and we want react
        // to treat them as the same record instead of re-rendering
        // when they key changes.
        changeState={this.props.changeState}
        hovered={service.get('id') === this.props.hoveredId}
        key={service.get('name')}
        ref={'AddedServicesListItem-' + service.get('id')}
        service={service}
        serviceModule={this.props.serviceModule} />);
  }

  /**
    Generate the list of the labels and applications.
    @param {Object} services A YUI ModelList of applications.
    @returns {Array} A list of applications and label components to render.
  */
  generateItemList(services) {
    const grouped = {};
    // Group all of the applications by the bundleURL if one exists.
    services.each(service => {
      const bundleURL = service.get('annotations').bundleURL;
      if (bundleURL) {
        addToObj(grouped, bundleURL, service);
        return;
      }
      addToObj(grouped, 'solo', service);
    });
    const items = [];
    // We'll put the solo ones at the top for now, this can be moved later.
    if (grouped.solo) {
      grouped.solo.forEach(app => {
        items.push(this._newListItem(app));
      });
      delete grouped.solo;
    }
    for (let key in grouped) {
      // A bundleURL is in the format elasticsearch-cluster/bundle/17 so just
      // create a label using the bundle name itself.
      items.push(<AddedServicesLabel name={key.split('/')[0]} />);
      // Now that the label has been added, loop through the applications in that
      // bundle.
      grouped[key].forEach(app => {
        items.push(this._newListItem(app));
      });
    }
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
  hoveredId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]),
  serviceModule: shapeup.shape({
    hoverService: PropTypes.func.isRequired,
    panToService: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc
  }),
  services: PropTypes.object.isRequired
};

module.exports = AddedServicesList;
