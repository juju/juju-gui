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

YUI.add('entity-content-readme', function() {

  juju.components.EntityContentReadme = React.createClass({
    readmeXhr: null,

    getInitialState: function() {
      return {
        readme: null,
      };
    },

    componentDidMount: function() {
      this._getReadme();
    },

    componentWillUnmount: function() {
      this.readmeXhr.abort();
    },

    /**
      Get the content for the readme.

      @method _getReadme
      @return {Object} The readme content.
    */
    _getReadme: function() {
      var entityModel = this.props.entityModel;
      var readmeFile = this._getReadmeFile(entityModel);
      if (!readmeFile) {
        this._getReadmeFailure();
      } else {
        var id = entityModel.get('id');
        this.readmeXhr = this.props.getFile(id, readmeFile,
            this._getReadmeSuccess, this._getReadmeFailure);
      }
    },

    /**
      Get the filename for the readme.

      @method _getReadmeFile
      @param {Object} entityModel The entity model.
      @return {Object} The readme filename.
    */
    _getReadmeFile: function(entityModel) {
      var files = entityModel.get('files');
      var match;
      files.some(function(file) {
        if (file.toLowerCase().slice(0, 6) === 'readme') {
          match = file;
          return true;
        }
      });
      return match;
    },

    /**
      Update the readme with the retrieved markdown.

      @method _getReadmeSuccess
      @param {Object} data The returned data for the readme.
    */
    _getReadmeSuccess: function(data) {
      var readme = data.target.responseText;
      this.setState({readme: this.props.renderMarkdown(readme)});
    },

    /**
      Display a message if there is no readme.

      @method _getReadmeFailure
    */
    _getReadmeFailure: function() {
      this.setState({readme: 'No readme.'});
    },

    render: function() {
      return (
        <div className="entity-content_readme">
          <h2 id="readme">Readme</h2>
          <div className="entity-content_readme-content"
            dangerouslySetInnerHTML={{__html: this.state.readme}} />
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: []
});
