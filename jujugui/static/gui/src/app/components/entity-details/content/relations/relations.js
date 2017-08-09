/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

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
          role="button"
          tabIndex="0"
          onClick={this._handleRelationClick.bind(
            this, type, relation.interface)}
          key={relation.name}>
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
            role="button"
            onClick={this._handleViewMore.bind(this)}>
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
            <juju.components.SvgIcon
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

YUI.add('entity-content-relations', function() {
  juju.components.EntityContentRelations = EntityContentRelations;
}, '0.1.0', {requires: [
  'svg-icon'
]});
