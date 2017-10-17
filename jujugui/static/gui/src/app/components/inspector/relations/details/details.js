/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

class InspectorRelationDetails extends React.Component {
  render() {
    var relation = this.props.relation;
    return (
      <div className="inspector-relation-details">
        <div className="inspector-relation-details__properties">
          <p className="inspector-relation-details__property">
            Interface: {relation.interface || 'none'}
          </p>
          <p className="inspector-relation-details__property">
            Name: {relation.near.name || 'none'}
          </p>
          <p className="inspector-relation-details__property">
            Role: {relation.near.role || 'none'}
          </p>
          <p className="inspector-relation-details__property">
            Scope: {relation.scope || 'none'}
          </p>
        </div>
      </div>
    );
  }
};

InspectorRelationDetails.propTypes = {
  relation: PropTypes.object.isRequired
};

module.exports = InspectorRelationDetails;
