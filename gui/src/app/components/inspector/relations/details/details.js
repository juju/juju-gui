/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

require('./_details.scss');

class InspectorRelationDetails extends React.Component {
  componentDidMount() {
    this.props.analytics.addCategory(this).sendEvent(this.props.analytics.VIEW);
  }

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
  analytics: PropTypes.object.isRequired,
  relation: PropTypes.object.isRequired
};

module.exports = InspectorRelationDetails;
