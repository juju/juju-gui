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

YUI.add('entity-content', function() {

  juju.components.EntityContent = React.createClass({
    /* Define and validate the properites available on this component. */
    propTypes: {
      entityModel: React.PropTypes.object.isRequired,
      renderMarkdown: React.PropTypes.func.isRequired,
      getFile: React.PropTypes.func.isRequired,
      changeState: React.PropTypes.func.isRequired,
      pluralize: React.PropTypes.func.isRequired
    },

    /**
      Generate the list of configuration options.

      @method _generateOptionsList
      @param {Object} entityModel The entity model.
      @return {Object} The options markup.
    */
    _generateOptionsList: function(entityModel) {
      if (entityModel.get('entityType') === 'bundle') {
        return;
      }
      var options = entityModel.get('options');
      if (options) {
        var optionsList = [];
        Object.keys(options).forEach(function(name) {
          var option = options[name];
          option.name = name;
          optionsList.push(
            <juju.components.EntityContentConfigOption
              key={name}
              option={option} />
          );
        }, this);
        return (
          <div id="configuration" className="row entity-content__configuration">
            <div className="inner-wrapper">
              <div className="twelve-col">
                <h2 className="entity-content__header">Configuration</h2>
                <dl>
                  {optionsList}
                </dl>
              </div>
            </div>
          </div>
        );
      }
    },

    /**
      Generates an HTML list from the supplied array.

      @method _generateList
      @param {Array} list The list of objects to markup.
      @param {Function} handler The click handler for each item.
      @return {Array} The list markup.
    */
    _generateList: function(list, handler) {
      return list.map(function(item) {
        return (
          <li key={item}>
            <a data-id={item} onClick={handler}>
              {item}
            </a>
          </li>
        );
      });
    },

    /**
      Generate the list of Tags if available.

      @method _generateTags
      @return {Array} The tags markup.
    */
    _generateTags: function() {
      // Have to convert {0: 'database'} to ['database'].
      var tags = [],
          entityTags = this.props.entityModel.get('tags'),
          index;
      if (!entityTags) {
        return;
      }
      for (index in entityTags) {
        tags.push(entityTags[index]);
      }
      return (
        <div className="four-col entity-content__metadata">
          <h4>Tags</h4>
          <ul>
            {this._generateList(tags, this._handleTagClick)}
          </ul>
        </div>);
    },

    /**
      Handle clicks on tags.

      @method _handleTagClick
      @param {Object} e The event.
    */
    _handleTagClick: function(e) {
      e.stopPropagation();
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: null,
            tags: e.target.getAttribute('data-id')
          }
        }
      });
    },

    /**
      Generate the description if it is a charm.

      @method _generateDescription
      @param {Object} entityModel The entity model.
      @return {Object} The description markup.
    */
    _generateDescription: function(entityModel) {
      if (entityModel.get('entityType') === 'charm') {
        var bugLink = `https://bugs.launchpad.net/charms/+source/` +
          `${entityModel.get('name')}`;
        return (
          <div className="row entity-content__description">
            <div className="inner-wrapper">
              <div className="twelve-col">
                <p>{entityModel.get('description')}</p>
              </div>
              {this._generateTags()}
              <div className="four-col entity-content__metadata last-col">
                <h4>More information</h4>
                <ul>
                  <li>
                    <a href={bugLink} target="_blank">
                      Bugs
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
      }
    },

    /**
      We only show the relations when it's a charm, but not a bundle.

      @method _showEntityRelations
    */
    _showEntityRelations: function() {
      var entityModel = this.props.entityModel;
      if (entityModel.get('entityType') === 'charm') {
        return (
          <div className="four-col">
            <juju.components.EntityContentRelations
              changeState={this.props.changeState}
              relations={entityModel.get('relations')} />
          </div>);
      }
    },

    /**
      We only show the revisions when it's a charm, but not a bundle.

      @method _showEntityRevisions
    */
    _showEntityRevisions: function() {
      var entityModel = this.props.entityModel;
      if (entityModel.get('entityType') === 'charm') {
        return (
          <div className="four-col">
            <juju.components.EntityContentRevisions
              revisions={entityModel.get('revisions')} />
          </div>);
      }
    },

    render: function() {
      var entityModel = this.props.entityModel;
      return (
        <div className="entity-content">
          {this._generateDescription(entityModel)}
          <div className="row">
            <div className="inner-wrapper">
              <div className="seven-col append-one">
                <juju.components.EntityContentReadme
                  entityModel={entityModel}
                  renderMarkdown={this.props.renderMarkdown}
                  getFile={this.props.getFile} />
              </div>
              {this._showEntityRelations()}
              <div className="four-col">
                <juju.components.EntityFiles
                  entityModel={entityModel}
                  pluralize={this.props.pluralize} />
              </div>
              {this._showEntityRevisions()}
            </div>
          </div>
          {this._generateOptionsList(entityModel)}
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: [
    'entity-content-config-option',
    'entity-content-readme',
    'entity-content-relations',
    'entity-content-revisions',
    'entity-files'
  ]
});
