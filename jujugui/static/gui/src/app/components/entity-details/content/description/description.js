/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const HashLink = require('../../../hash-link/hash-link');

class EntityContentDescription extends React.Component {
  render() {
    const description = this.props.entityModel.get('description');
    if (!description) {
      return false;
    }
    const htmlDescription = this.props.renderMarkdown(description);
    let heading = null;
    if (this.props.includeHeading) {
      heading = (
        <h2 className="entity-content__header" id="description">
          Description
          <HashLink
            changeState={this.props.changeState}
            hash="description" />
        </h2>
      );
    }
    return (
      <div className="entity-content__description">
        {heading}
        <div className="entity-content__description-content"
          dangerouslySetInnerHTML={{__html: htmlDescription}}>
        </div>
      </div>
    );
  }
};

EntityContentDescription.propTypes = {
  changeState: PropTypes.func,
  entityModel: PropTypes.object,
  includeHeading: PropTypes.bool,
  renderMarkdown: PropTypes.func.isRequired
};

module.exports = EntityContentDescription;
