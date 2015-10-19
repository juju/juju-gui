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
      entityModel: React.PropTypes.object.isRequired
    },

    _listRelated: function(related) {
      if (!related || related.length <= 0) {
        return '';
      }
      var relatedList = related.map(function(bundle) {
        return (
          <li className="list-item twelve-col box related-bundle">
            <a target="_blank" data-id="{bundle.Id}" className="name">
              {bundle.Id}
            </a>
          </li>
        );
      });
      var seeMore = related.length <= 2 ? '' :
        <li className="seven-col list__controls align-center">See more</li>;
      return (
        <div className="related section clearfix" id="related">
          <h2 className="section__title">Used in {related.length} solutions</h2>
          <ul className="eq-height list--concealed list--visible-2 no-bullets">
            {relatedList}
            {seeMore}
          </ul>
        </div>
      );
    },

    /**
      Generate the list of configuration options.

      @method _generateOptionsList
      @param {Object} options The collection of options.
      @return {Object} The options markup.
    */
    _generateOptionsList: function(options) {
      var optionsList = [];
      Object.keys(options).forEach(function(name) {
        var option = options[name];
        optionsList.push(
          <juju.components.EntityContentConfigOption
            key={name}
            name={name}
            description={option.description}
            type={option.type}
            default={option.default} />
        );
      }, this);
      return optionsList;
    },

    /**
      Create the markup for the description.

      @method _generateDescription
      @param {String} description The entity's description.
      @return {Object} The description markup.
    */
    _generateDescription: function(description) {
      return description ?
        <div className="entity__description section is-closed"
             itemProp="description">
          <h2 className="section__title">Description</h2>
          <p>{description}</p>
        </div> :
        '';
    },

    /**
      Create the markup for the readme.

      @method _generateReadme
      @param {String} readme The entity's readme.
      @return {Object} The options readme.
    */
    _generateReadme: function(readme) {
      return readme ?
        <div className="readme section">
          <h2 id="readme" className="section__title">Readme</h2>
          <div className="readme" dangerouslySetInnerHTML={readme} />
        </div> :
        '';
    },

    render: function() {
      var entityModel = this.props.entityModel;
      var entity = entityModel.toEntity();
      return (
        <div className="row details">
          <div className="inner-wrapper">
            <main className="seven-col append-one">
              {this._generateDescription(entity.description)}
              {this._listRelated(entity.related)}
              {this._generateReadme(entity.readme)}
              <div className="configuration section" id="configuration">
                  <h3 className="section__title">Configuration</h3>
                  <dl>
                    {this._generateOptionsList(entityModel.get('options'))}
                  </dl>
              </div>
            </main>
          </div>
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: [
    'entity-content-config-option'
  ]
});
