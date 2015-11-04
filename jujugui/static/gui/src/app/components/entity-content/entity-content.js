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
      getFile: React.PropTypes.func.isRequired
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
          <div className="entity-content__configuration" id="configuration">
            <h3>Configuration</h3>
            <dl>
              {optionsList}
            </dl>
          </div>);
      }
    },

    /**
      Generate the description if it is a charm.

      @method _generateDescription
      @param {Object} entityModel The entity model.
      @return {Object} The description markup.
    */
    _generateDescription: function(entityModel) {
      if (entityModel.get('entityType') === 'charm') {
        return <div className="entity-content__description">
            <h2>Description</h2>
            <p>{entityModel.get('description')}</p>
          </div>;
      }
    },

    render: function() {
      var entityModel = this.props.entityModel;
      return (
        <div className="row entity-content">
          <div className="inner-wrapper">
            <main className="seven-col append-one">
              {this._generateDescription(entityModel)}
              <juju.components.EntityContentReadme
                entityModel={entityModel}
                renderMarkdown={this.props.renderMarkdown}
                getFile={this.props.getFile} />
              {this._generateOptionsList(entityModel)}
            </main>
          </div>
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: [
    'entity-content-config-option',
    'entity-content-readme'
  ]
});
