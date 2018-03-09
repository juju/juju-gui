/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../../../svg-icon/svg-icon');

class EntityContentRelations extends React.Component {
  constructor() {
    super();

    this.state = {
      showAllRelations: false
    };
  }

  /**
    Handle clicks on tags.

    @method _handleTagClick
    @param {String} type The requirement type.
    @param {String} name The requirement interface.
  */
  _handleRelationClick(type, name) {
    const search = {
      text: ''
    };
    search[type] = name;
    this.props.changeState({
      search: search,
      store: null
    });
  }

  _handleViewMore() {
    this.setState({
      showAllRelations: !this.state.showAllRelations
    });
  }

  /**
    Generate the list of relations.

    @method _generateRelations
    @return {Object} The relation markup.
  */
  _generateRelations() {
    var components = [];
    var relations = this.props.relations;
    var requires = [];
    if (relations.requires) {
      requires = Object.keys(relations.requires).map(function(key) {
        return relations.requires[key];
      });
    }
    var provides = [];
    if (relations.provides) {
      provides = Object.keys(relations.provides).map(function(key) {
        return relations.provides[key];
      });
    }
    const relationsList = provides.concat(requires);
    relationsList.forEach((relation, i) => {
      const classes = classNames(
        'link section__list-item',
        {
          'hidden': !this.state.showAllRelations && i > 1
        }
      );
      const type = this.role === 'requirer' ? 'requires' : 'provides';
      components.push(
        <li className={classes}
          key={relation.name}
          onClick={this._handleRelationClick.bind(
            this, type, relation.interface)}
          role="button"
          tabIndex="0">
          {relation.name}: {relation.interface}
        </li>
      );
    }, this);
    if (components.length > 2) {
      const buttonText = this.state.showAllRelations ?
        'View fewer relations' :
        'View more relations';
      components.push(
        <li className="section__list-item" key="show-more">
          <button className="button--inline-neutral"
            onClick={this._handleViewMore.bind(this)}
            role="button">
            {buttonText}
          </button>
        </li>
      );
    }
    return components;
  }

  render() {
    return (
      <div className="section entity-relations" id="relations">
        <h3 className="section__title">
          Relations&nbsp;
          <a href={
            'https://jujucharms.com/docs/stable/' +
            'charms-relations'}
          target="_blank">
            <SvgIcon
              name="help_16"
              size="16" />
          </a>
        </h3>
        <ul className="section__list" ref="list">
          {this._generateRelations()}
        </ul>
      </div>
    );
  }
};

EntityContentRelations.propTypes = {
  changeState: PropTypes.func.isRequired,
  relations: PropTypes.object.isRequired
};

module.exports = EntityContentRelations;
