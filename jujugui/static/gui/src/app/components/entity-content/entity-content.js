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

    _listOptions: function(options) {
      if (!options) {
        return '';
      }
      var optionsList = [],
          n;
      for (n in options) {
        var val = options[n];
        var valType = val.Type ?
          <span className="charms__list--config-type">({val.Type})</span> :
          '';
        optionsList.push(
          <dt id={'charm-config-' + n} className="charms__list--config-name">
            {n}
          </dt>
        );
        optionList.push(
          <dd className="charms__list--config-description">
            {valType}
            {' '}
            {val.Description ? val.Description : ''}
          </dd>
        );
        if (val.Default) {
          optionsList.push(
            <dd className="charms__list--config-setting">{val.Default}</dd>
          );
        }
      }
      return (
        <div className="configuration section" id="configuration">
            <h3 className="section__title">Configuration</h3>
            <dl>
              {optionsList}
            </dl>
        </div>
      );
    },

    render: function() {
      var entity = this.props.entityModel.toEntity();

      var description = entity.description ?
        <div className="entity__description section is-closed"
             itemProp="description">
          <h2 className="section__title">Description</h2>
          <p>{entity.description}</p>
        </div> :
        '';

      var readme = entity.readme ?
        <div className="readme section">
          <h2 id="readme" className="section__title">Readme</h2>
          <div className="readme" dangerouslySetInnerHTML={readme} />
        </div> :
        '';

      return (
        <div className="row details">
          <div className="inner-wrapper">
            <main className="seven-col append-one">
              {description}
              {this._listRelated(entity.related)}
              {readme}
              {this._listOptions(entity.options)}
            </main>

            <aside className="four-col last-col">
              Side column?
            </aside>
          </div>
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: []
});
