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

YUI.add('import-export', function() {

  juju.components.ImportExport = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      changeState: React.PropTypes.func.isRequired,
      currentChangeSet: React.PropTypes.object.isRequired,
      exportEnvironmentFile: React.PropTypes.func.isRequired,
      hasEntities: React.PropTypes.bool.isRequired,
      hideDragOverNotification: React.PropTypes.func.isRequired,
      importBundleFile: React.PropTypes.func.isRequired,
      renderDragOverNotification: React.PropTypes.func.isRequired,
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
        'import-export',
        {
          'import-export--initial': !this.props.hasEntities &&
            Object.keys(this.props.currentChangeSet).length === 0
        }
      );
    },

    render: function() {
      var isReadOnly = this.props.acl.isReadOnly();
      return (
        <div className={this._generateClasses()}>
          <span className="import-export__export link"
            onClick={this._handleExport}
            role="button"
            title="Export"
            tabIndex="0">
            <juju.components.SvgIcon name="export_16"
              className="import-export__icon"
              size="16" />
          </span>
          <span className="import-export__import link"
            onClick={!isReadOnly && this._handleImportClick}
            role="button"
            title="Import"
            tabIndex="0">
            <juju.components.SvgIcon name="import_16"
              className="import-export__icon"
              size="16" />
          </span>
          <input className="import-export__file"
            type="file"
            onChange={!isReadOnly && this._handleImportFile}
            accept=".zip,.yaml,.yml"
            ref="file-input" />
        </div>
      );
    }
  });

}, '0.1.0', { requires: []});
