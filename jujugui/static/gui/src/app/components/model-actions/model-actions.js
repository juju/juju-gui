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

YUI.add('model-actions', function() {

  juju.components.ModelActions = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      changeState: React.PropTypes.func.isRequired,
      currentChangeSet: React.PropTypes.object.isRequired,
      exportEnvironmentFile: React.PropTypes.func.isRequired,
      hasEntities: React.PropTypes.bool.isRequired,
      hideDragOverNotification: React.PropTypes.func.isRequired,
      importBundleFile: React.PropTypes.func.isRequired,
      renderDragOverNotification: React.PropTypes.func.isRequired,
      sharingVisibility: React.PropTypes.func.isRequired,
      userIsAuthenticated: React.PropTypes.bool.isRequired
    },

    getDefaultProps: function() {
      return {
        sharingVisibility: () => {
          console.log('No sharingVisibility function was provided.');
        }
      };
    },

    /**
      Export the env when the button is clicked.

      @method _handleExport
    */
    _handleExport: function() {
      this.props.exportEnvironmentFile();
    },

    /**
      Open a file picker when the button is clicked.

      @method _handleImportClick
    */
    _handleImportClick: function() {
      var input = this.refs['file-input'];
      if (input) {
        input.click();
      }
    },

    /**
      When file is submitted the drag over animation is triggered and the file
      is passed to the utils function.

      @method _handleImportFile
    */
    _handleImportFile: function() {
      var inputFile = this.refs['file-input'].files[0];
      if (inputFile) {
        this.props.renderDragOverNotification(false);
        this.props.importBundleFile(inputFile);
        setTimeout(() => {
          this.props.hideDragOverNotification();}, 600);
      }
    },

    /**
      Returns the classes for the button based on the provided props.
      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      return classNames(
        'model-actions',
        {
          'model-actions--initial': !this.props.hasEntities &&
            Object.keys(this.props.currentChangeSet).length === 0
        }
      );
    },

    render: function() {
      let shareAction;
      if (this.props.userIsAuthenticated) {
        shareAction = (
          <span className="model-actions__share model-actions__button"
            onClick={this.props.sharingVisibility}
            role="button"
            tabIndex="0">
            <juju.components.SvgIcon name="share_16"
              className="model-actions__icon"
              size="16" />
            <span className="tooltip__tooltip--below">
              <span className="tooltip__inner tooltip__inner--up">
                Share
              </span>
            </span>
          </span>
        );
      }
      var isReadOnly = this.props.acl.isReadOnly();
      return (
        <div className={this._generateClasses()}>
          <div className="model-actions__buttons">
            <span className="model-actions__export model-actions__button"
              onClick={this._handleExport}
              role="button"
              tabIndex="0">
              <juju.components.SvgIcon name="export_16"
                className="model-actions__icon"
                size="16" />
              <span className="tooltip__tooltip--below">
                <span className="tooltip__inner tooltip__inner--up">
                  Export
                </span>
              </span>
            </span>
            <span className="model-actions__import model-actions__button"
              onClick={!isReadOnly && this._handleImportClick}
              role="button"
              tabIndex="0">
              <juju.components.SvgIcon name="import_16"
                className="model-actions__icon"
                size="16" />
              <span className="tooltip__tooltip--below">
                <span className="tooltip__inner tooltip__inner--up">
                  Import
                </span>
              </span>
            </span>
            {shareAction}
          </div>
          <input className="model-actions__file"
            type="file"
            onChange={isReadOnly ? null : this._handleImportFile}
            accept=".zip,.yaml,.yml"
            ref="file-input" />
        </div>
      );
    }
  });

}, '0.1.0', { requires: []});
