/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

class InspectorResourcesList extends React.Component {
  /**
    Generate a list of resources to display.

    @returns {Object} The resource list markup.
  */
  _generateResources() {
    const resources = this.props.resources;
    const resourceList = resources.map((resource, i) => {
      return (
        <li className="inspector-resources-list__resource"
          key={resource.Name + i}>
          <p>{resource.Name}</p>
          <p>{resource.Description}</p>
        </li>);
    });
    return (
      <ul className="inspector-resources-list__list">
        {resourceList}
      </ul>);
  }

  render() {
    return (
      <div className="inspector-resources-list">
        {this._generateResources()}
      </div>
    );
  }
};

InspectorResourcesList.propTypes = {
  acl: PropTypes.object.isRequired,
  resources: PropTypes.array.isRequired
};

module.exports = InspectorResourcesList;
