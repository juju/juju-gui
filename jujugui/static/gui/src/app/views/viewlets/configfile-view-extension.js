/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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


YUI.add('configfile-view-extension', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      models = Y.namespace('juju.models');

  /**
    Extension to allow the config file uploads for the ghost inspector and
    service inspector views.

    @class ConfigFileMixin
  */
  function ConfigFileViewExtension() {}

  ConfigFileViewExtension.prototype = {
    /**
      Handles the click on the file input and dispatches to the proper function
      depending if a file has been previously loaded or not.

      @method handleFileClick
      @param {Y.EventFacade} e An event object.
    */
    handleFileClick: function(e) {
      if (e.currentTarget.getHTML().indexOf('Remove') === -1) {
        // Because we can't style file input buttons properly we style a normal
        // element and then simulate a click on the real hidden input when our
        // fake button is clicked.
        e.container.one('input[type=file]').getDOMNode().click();
      } else {
        this.onRemoveFile(e);
      }
    },

    /**
      Handle the file upload click event. Creates a FileReader instance to
      parse the file data.


      @method onFileChange
      @param {Y.EventFacade} e An event object.
    */
    handleFileChange: function(e) {
      var file = e.currentTarget.get('files').shift(),
          reader = new FileReader();
      reader.onerror = Y.bind(this.onFileError, this);
      reader.onload = Y.bind(this.onFileLoaded, this, file.name);
      reader.readAsText(file);
      // Because this is a shared method the controls node is only there
      // on the deployed inspector not the ghost inspector.
      var controls = this.get('container').one('.controls');
      if (controls) {
        controls.removeClass('closed');
      }
    },


    /**
      Callback called when an error occurs during file upload.
      Hide the charm configuration section.

      @method onFileError
      @param {Object} e An event object (with a "target.error" attr).
    */
    onFileError: function(e) {
      var error = e.target.error, msg;
      switch (error.code) {
        case error.NOT_FOUND_ERR:
          msg = 'File not found';
          break;
        case error.NOT_READABLE_ERR:
          msg = 'File is not readable';
          break;
        case error.ABORT_ERR:
          break; // noop
        default:
          msg = 'An error occurred reading this file.';
      }
      if (msg) {
        var db = this.viewletManager.get('db');
        db.notifications.add(
            new models.Notification({
              title: 'Error reading configuration file',
              message: msg,
              level: 'error'
            }));
      }
    },

    /**
      Callback called when a file is correctly uploaded.
      Hide the charm configuration section.

      @method onFileLoaded
      @param {Object} e An event object.
    */
    onFileLoaded: function(filename, e) {
      // Add a link for the user to remove this file now that it's loaded.
      var container = this.get('container');
      var button = container.one('.fakebutton');
      button.setHTML(filename + ' - Remove file');
      //set the configFileContent on the viewlet-manager so we can have access
      //to it when the user submit their config.
      this.viewletManager.configFileContent = e.target.result;
      if (!this.viewletManager.configFileContent) {
        // Some file read errors do not go through the error handler as
        // expected but instead return an empty string.  Warn the user if
        // this happens.
        var db = this.viewletManager.get('db');
        db.notifications.add(
            new models.Notification({
              title: 'Configuration file error',
              message: 'The configuration file loaded is empty.  ' +
                  'Do you have read access?',
              level: 'error'
            }));
      }
      container.all('.charm-settings, .settings-wrapper.toggle').hide();
    },

    /**
      Handle the file remove click event by clearing out the input
      and resetting the UI.

      @method onRemoveFile
      @param {Y.EventFacade} e an event object from click.
    */
    onRemoveFile: function(e) {
      var container = this.get('container');
      this.viewletManager.configFileContent = null;
      container.one('.fakebutton').setHTML('Import config file...');
      container.all('.charm-settings, .settings-wrapper.toggle').show();
      // Replace the file input node.  There does not appear to be any way
      // to reset the element, so the only option is this rather crude
      // replacement.  It actually works well in practice.
      container.one('input[type=file]')
               .replace(Y.Node.create('<input type="file"/>'));
    }
  };

  ns.ConfigFileViewExtension = ConfigFileViewExtension;
}, '', {
  requires: [
    'juju-charm-models'
  ]
});
