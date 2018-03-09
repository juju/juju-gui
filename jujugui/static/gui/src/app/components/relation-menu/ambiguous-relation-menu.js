/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../svg-icon/svg-icon');

const AmbiguousRelationMenu = function(props) {
  /**
    Generate a list of bindings.

    @method _generateRelations
    @param {Array} endpoints A list of endpoints.
    @returns {Object} The endpoint components to display.
  */
  function _generateRelations(endpoints) {
    var components = [];
    endpoints.forEach((endpoint, i) => {
      var start = endpoint[0];
      var end = endpoint[1];
      components.push(
        <li
          data-endname={end.name}
          data-endservice={end.service}
          data-startname={start.name}
          data-startservice={start.service}
          key={start.name + end.name + i}>
          {start.displayName}:{start.name} &rarr; {end.displayName}:{end.name}
        </li>);
    });
    return components;
  }

  return (
    <div className="menu">
      <ul>
        {_generateRelations(props.endpoints)}
      </ul>
      <div className="cancel link" role="button" tabIndex="0">
        <SvgIcon name="close_16"
          size="16" />
      </div>
    </div>
  );
};

AmbiguousRelationMenu.propTypes = {
  endpoints: PropTypes.array.isRequired
};

module.exports = AmbiguousRelationMenu;
