/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

class EntityContentConfigOption extends React.Component {
  /**
    Create the markup for default value.

    @method _generateDefault
    @param {String} defaultValue The option default.
    @return {Object} The generated markup.
  */
  _generateDefault(defaultValue) {
    if (defaultValue) {
      return (
        <dd className="entity-content__config-default">
          {defaultValue}
        </dd>);
    }
    return;
  }

  render() {
    var option = this.props.option;
    return (
      <div className="entity-content__config-option">
        <dt className="entity-content__config-name"
          id={'charm-config-' + option.name}>
          {option.name}
        </dt>
        <dd className="entity-content__config-description">
          <p>
            <span className="entity-content__config-type">
              ({option.type})
            </span>
            {' '}
            {option.description}
          </p>
        </dd>
        {this._generateDefault(option.default)}
      </div>
    );
  }
};

EntityContentConfigOption.propTypes = {
  option: PropTypes.object.isRequired
};

module.exports = EntityContentConfigOption;
