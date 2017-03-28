/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

YUI.add('entity-resources', function() {

  juju.components.EntityResources = React.createClass({

    propTypes: {
      apiUrl: React.PropTypes.string.isRequired,
      entityId: React.PropTypes.string.isRequired,
      pluralize: React.PropTypes.func.isRequired,
      resources: React.PropTypes.array
    },

    getInitialState: function() {
      const props = this.props;
      const url = window.jujulib.URL.fromLegacyString(props.entityId);
      const entityPath = url.legacyPath();
      return {
        baseUrl: `${props.apiUrl}/${entityPath}/resource`
      };
    },

    /**
      Generate a single resource to display.

      @param {Object} resource the resource being displayed.
      @returns {Object} The resource markup.
    */
    _generateResource: function(resource) {
      const revision = resource.Revision;
      const name = resource.Name;
      // Get the file extension.
      const parts = resource.Path.split('.');
      let extension = '';
      // If there is a file extension then format it for display.
      if (parts.length > 1) {
        extension = `(.${parts.pop()})`;
      }
      let itemContent = (
        <span>
          {name} {extension}
        </span>
      );
      // You can create a charm with a resource but not attach the content yet.
      // In that case, the revision is -1 and the resource is not downloadable.
      if (revision >= 0) {
        const resourceUrl = `${this.state.baseUrl}/${name}/${revision}`;
        itemContent = (
          <a href={resourceUrl} title={'Download ' + name}>
            {name} {extension}
          </a>
        );
      }
      return itemContent;
    },

    /**
      Generate a list of resources to display.

      @returns {Object} The resource list markup.
    */
    _generateResources: function() {
      const props = this.props;
      const resources = props.resources;
      if (!resources || resources.length === 0) {
        return;
      }
      const resourceList = resources.map((resource, i) => {
        return (
          <li className="entity-files__file"
            key={resource.Name + i}>
            {this._generateResource(resource)}
          </li>);
      });
      return (
        <div className="entity-resources section" id="files">
          <h3 className="section__title">
            {resourceList.length}&nbsp;
            {props.pluralize('resource', resourceList.length)}
          </h3>
          <ul className="section__list entity-files__listing">
            {resourceList}
          </ul>
        </div>);
    },

    render: function() {
      return (
        <div>
          {this._generateResources()}
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
]});
