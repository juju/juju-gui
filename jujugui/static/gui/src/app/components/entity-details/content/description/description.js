'use strict';

const marked = require('marked');
const PropTypes = require('prop-types');
const React = require('react');

const HashLink = require('../../../hash-link/hash-link');

const EntityContentDescription = props => {
  const { description } = props;
  if (!description) {
    return false;
  }
  const htmlDescription = marked(description);
  let heading = null;
  if (props.includeHeading) {
    heading = (
      <h2 className="entity-content__header" id="description">
        Description
        <HashLink
          changeState={props.changeState}
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
};

EntityContentDescription.propTypes = {
  changeState: PropTypes.func,
  description: PropTypes.string,
  includeHeading: PropTypes.bool
};

module.exports = EntityContentDescription;
