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
      apiUrl: React.PropTypes.string.isRequired,
      entityModel: React.PropTypes.object.isRequired,
      pluralize: React.PropTypes.func.isRequired
    },

    /**
      Expand a directory when clicked.

      @method _onDirectoryClick
      @param {Object} e the event object.
    */
    _onDirectoryClick: function(e) {
      e.stopPropagation();
      var target = e.currentTarget;
      var isCollapsed = target.className.indexOf('collapsed') > 0;
      target.className = classNames(
        'entity-files__directory',
        {'collapsed': !isCollapsed}
      );
    },

    /**
      Recursively build a tree structure representing the entity's file.

      @method _buildFiletree
      @param {Array} files the list of file paths.
      @returns {Object} filetree the corresponding tree structure.
    */
    _buildFiletree: function(files) {
      /**
        Recursive helper adds a single path to an existing file tree.

        @method _buildFiletree
        @param {Object} node current node in the tree structure.
        @param {Array} segments remaining file paths to parse.
      */
      function extendTree(node, segments) {
        var segment = segments.shift();
        // Skip the root node, signified by an empty string.
        if (segment === '') {
          segment = segments.shift();
        }
        if (segments.length) {
          if (!node[segment]) {
            node[segment] = {};
          };
          extendTree(node[segment], segments);
        } else {
          node[segment] = null;
        }
      }

      var filetree = {};
      files.forEach(function(file) {
        extendTree(filetree, file.split('/'));
      });
      return filetree;
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
          <li className="entity-files__link section__list-item">
            <a ref="codeLink"
              className="link"
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
      var filetree = this._buildFiletree(files);

      /**
        Recursively create a nested list.

        @method buildList
        @param {String} path The current path.
        @param {Array} children All child files and directories located under
        the current path.
        @return {Array} The nested markup for the list of files.
      */
      function buildList(path, children) {
        var fileName = path.split('/').pop();
        if (children === null) {
          var fileLink = `${url}/${path}`;
          return (
            <li key={path} className="entity-files__file">
              <a href={fileLink}
                className="link"
                title={fileName}
                target="_blank">
                {fileName}
              </a>
            </li>
          );
        } else {
          var childItems = [];
          // Note that this logic covers everything *but* the root node; see
          // the corresponding comment below.
          Object.keys(children).forEach(child => {
            childItems.push(buildList.call(this, `${path}/${child}`,
                                           children[child]));
          });
          return (
            <li key={path}
              className="entity-files__directory collapsed"
              tabIndex="0"
              role="button"
              onClick={this._onDirectoryClick}>
              {'/' + fileName}
              <ul className="entity-files__listing">
                {childItems}
              </ul>
            </li>
          );
        }
      }

      // Need to handle the root node separate from the recursive logic.
      // The loop that covers everything *but* the root node is above.
      var markup = [];
      Object.keys(filetree).forEach(file => {
        markup.push(buildList.call(this, file, filetree[file]));
      });
      return markup;
    },

    render: function() {
      var entityModel = this.props.entityModel;
      var files = entityModel.get('files');
      var name = (entityModel.get('entityType') === 'bundle')?
        entityModel.get('name'):entityModel.get('full_name');
      var archiveUrl = `${this.props.apiUrl}/${name}/archive`;
      return (
        <div className="entity-files section" id="files">
          <h3 className="section__title">
            {files.length + ' ' + this.props.pluralize('file', files.length)}
          </h3>
          <ul className="section__list">
            {this._generateCodeLink(entityModel.get('code_source'))}
            <li className="entity-files__link section__list-item">
              <a target="_blank"
                className="link"
                href={archiveUrl}>
                Download .zip
              </a>
            </li>
          </ul>
          <ul ref="files" className="section__list entity-files__listing">
            {this._generateFileItems(files, archiveUrl)}
          </ul>
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: []
});
