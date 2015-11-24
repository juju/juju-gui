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

YUI.add('entity-files', function() {

  juju.components.EntityFiles = React.createClass({
    /* Define and validate the properites available on this component. */
    propTypes: {
      entityModel: React.PropTypes.object.isRequired,
      pluralize: React.PropTypes.func.isRequired
    },

    /**
      If able, generates a link to the entity's source code.

      @method _generateCodeLink
      @param {Object} codeSource metadata about the entity's source code.
      @return {Object} The markup for the link to the code.
    */
    _generateCodeLink: function(codeSource) {
      codeSource = codeSource || {};
      var codeUrl = codeSource.location;
      var codeLink;
      if (codeUrl) {
        codeUrl = codeUrl.replace('lp:', 'https://code.launchpad.net/');
        codeLink = (
          <li className="entity-files__link">
            <a ref="codeLink"
              target="_blank"
              href={codeUrl}>
              View code
            </a>
          </li>
        );
      } else {
        codeLink = '';
      }
      return codeLink;
    },

    /**
      Create a list of linked files.

      @method _generateFileItems
      @param {Array} files An array of file names (Strings).
      @param {String} url The base URL for where the files are stored.
      @return {Array} The markup for the linked files.
    */
    _generateFileItems: function(files, url) {
      var fileItems = files.map(function(file) {
        var fileLink = `${url}/${file}`;
        return (
          <li key={file} className="entity-files__file">
            <a href={fileLink} target="_blank">
              {file}
            </a>
          </li>
        );
      });
      return fileItems;
    },

    render: function() {
      var entityModel = this.props.entityModel;
      var files = entityModel.get('files');
      var apiUrl = 'https://api.jujucharms.com/charmstore/v4';
      var archiveUrl = `${apiUrl}/${entityModel.get('full_name')}/archive`;
      var codeSource = entityModel.get('code_source');
      return (
        <div className="entity-files section" id="files">
          <h3 className="section__title">
            {files.length + ' ' + this.props.pluralize('file', files.length)}
          </h3>
          <ul className="entity-files__links">
            {this._generateCodeLink(codeSource)}
            <li className="entity-files__link">
              <a target="_blank"
                href={archiveUrl}>
                Download .zip
              </a>
            </li>
          </ul>
          <ul ref="files" className="entity-files__files">
            {this._generateFileItems(files, archiveUrl)}
          </ul>
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: []
});
