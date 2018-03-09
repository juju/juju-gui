/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../svg-icon/svg-icon');

const RelationMenu = function(props) {
  /**
    Get the real service name.

    @method _getRealServiceName
    @param {String} id The relation id.
    @param {Object} relation The relation.
    @returns {Object} The relation components to display.
  */
  function _getRealServiceName(id, relation) {
    var endpoint;
    if (id === relation.sourceId) {
      endpoint = relation.source;
    } else if (id === relation.targetId) {
      endpoint = relation.target;
    } else {
      // If it doesn't match any of the above it's a real relation id and we can
      // return that without modifying it.
      return id;
    }
    var type = id.split(':')[1];
    return endpoint.displayName
      .replace(/^\(/, '')
      .replace(/\)$/, '') + ':' + type;
  }

  /**
    Generate an icon to reflect the relation status.

    @param {Object} relation The relation.
    @returns {Object} The relation icon or null.
  */
  function _generateIcon(relation) {
    let icon = '';
    if (relation.hasRelationError()) {
      icon = 'error-outline';
    } else if (relation.pending) {
      icon = 'uncommitted';
    } else {
      // Don't need to show an icon.
      return null;
    }
    return (
      <SvgIcon
        name={icon}
        size="16" />);
  }

  /**
    Generate a list of bindings.

    @method _generateRelations
    @param {Array} relations A list of relations.
    @returns {Object} The relation components to display.
  */
  function _generateRelations(relations) {
    var components = [];
    relations.forEach(relation => {
      var relationClasses = 'relation-container ' + (
        relation.hasRelationError() ? 'error' : 'running');
      var sourceClasses = 'inspect-relation endpoint ' + (
        relation.sourceHasError() ? 'error' : '');
      var targetClasses = 'inspect-relation endpoint ' + (
        relation.targetHasError() ? 'error' : '');
      components.push(
        <li className={relationClasses}
          data-relationid={relation.id}
          key={relation.id}>
          {_generateIcon(relation)}
          <span className={sourceClasses}
            data-endpoint={relation.sourceId}>
            {_getRealServiceName(relation.sourceId, relation)}
          </span>
          {' '}-{' '}
          <span className={targetClasses}
            data-endpoint={relation.targetId}>
            {_getRealServiceName(relation.targetId, relation)}
          </span>
          <span className="relation-remove link">
            <SvgIcon name="delete_16"
              size="16" />
          </span>
        </li>);
    });
    return components;
  }

  return (
    <div className="menu">
      <div className="triangle">&nbsp;</div>
      <ul>
        {_generateRelations(props.relations)}
      </ul>
    </div>
  );
};

RelationMenu.propTypes = {
  relations: PropTypes.array.isRequired
};

module.exports = RelationMenu;
