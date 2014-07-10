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


YUI.add('service-config-view', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      views = Y.namespace('juju.views'),
      templates = Y.namespace('juju.views').Templates,
      plugins = Y.namespace('juju.plugins'),
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

  var name = 'config';
  var extensions = [
    ns.ViewletBaseView,
    ns.ConflictViewExtension,
    ns.ConfigFileViewExtension
  ];

  ns.Config = Y.Base.create(name, Y.View, extensions, {
    template: templates['service-configuration'],
    events: {
      '.settings-config button.confirm': { click: 'saveConfig'},
      '.settings-config button.cancel': { click: 'cancelConfig'},
      '.config-file .fakebutton': { click: 'handleFileClick'},
      '.config-file input[type=file]': { change: 'handleFileChange'},
      '.hidden-checkbox': { change: 'onCheckboxUpdate'}
    },
    bindings: {
      config: {
        'update': function(node, val) {
          if (node.getAttribute('type') === 'checkbox') {
            // In the db boolean options can be stored as strings.
            // Convert them to booleans.
            var booleanValue = (val + '' === 'true');
            if (booleanValue !== node.get('checked')) {
              node.set('checked', booleanValue);
              // We cannot simulate a change event here to trigger the textual
              // value to update or else we'll cause databinding to think
              // there's a conflict the next time this is changed via anyone
              // else.
              // We manually set the html content in order to avoid this.
              node.ancestor('.toggle').one('.textvalue').set('text',
                                                             val);
            }
          } else {
            // On update make sure undefined isn't sent to the user as viewable
            // input.
            if (val === undefined) {
              val = '';
            }
            node.set('value', val);

            if (node.resizingTextarea) {
              // We're hacking into the private method because the extension
              // wasn't designed with the idea that there could be a
              // non-user interface driven change. If the databinding value
              // changes we need to update/resize things and we can't simulate
              // a valueChange event.
              node.resizingTextarea._run_change(val);
            }
          }
        }
      }
    },

    /**
      View standard render call.

      @method render
      @param {Object} viewContainerAttrs an object of helper data from the
        viewlet manager.
    */
    render: function(viewContainerAttrs) {
      var service = viewContainerAttrs.model;
      var settings = [];
      var db = viewContainerAttrs.db;
      var charm = db.charms.getById(service.get('charm'));
      if (!charm) {
        // XXX j.c.sackett Jul 10 2014: With dispatched urls in persistent
        // environements, data may not be loaded at the time we try to load the
        // inspectors. While we have a strategy to deal with this at the base
        // level, for now we'll just bail. See bug 1340417.
        this.fire('changeState', {
          sectionA: {
            component: null,
            metadata: { id: null }
          }
        });
        db.notifications.add({
          title: 'Could not load charm details.',
          message: 'The charm ' + service.get('charm') + ' has not yet loaded.',
          level: 'error'
        });
      } else {
        var templatedSettings = utils.extractServiceSettings(
            charm.get('options'), service.get('config'));

        var container = this.get('container');

        container.setHTML(
            this.template({
              service: service,
              settings: templatedSettings,
              exposed: service.get('exposed')}));
        container.all('textarea.config-field').plug(
            plugins.ResizingTextarea, {
              max_height: 200,
              min_height: 18,
              single_line: 18
            }
        );
        this.attachExpandingTextarea();
      }
    },
    /**
      Ensures that all resizing textareas are attached.

      @method attachExpandingTextarea
    */
    attachExpandingTextarea: function() {
      this.get('container').all('textarea.config-field').each(function(n) {
        if (n.resizingTextarea) {
          n.resizingTextarea.resize();
        }
      });
    },
    /**
      Force resize the config textareas.
      ResizingTextarea needs the nodes to be visible to resize properly. We
      hook into the show() so that we can force the resize once the node is
      made visible via its viewlet container. Note that there are dupe hidden
      textarea nodes so we need to check if the node found has the plugin on
      it before running resize.

      @method show
    */
    show: function() {
      this.get('container').show();
      this.attachExpandingTextarea();
    },

    /**
      Pulls the content from each configuration field and sends the values
      to the environment

      @method saveConfig
    */
    saveConfig: function() {
      var inspector = this.viewletManager,
          db = inspector.get('db'),
          service = inspector.get('model'),
          charmUrl = service.get('charm'),
          charm = db.charms.getById(charmUrl),
          schema = charm.get('options'),
          container = this.get('container'),
          errors = {},
          config;

      container.one('.controls').addClass('closed');

      if (inspector.configFileContent) {
        config = null;
      } else {
        config = utils.getElementsValuesMapping(container, '.config-field');
        errors = utils.validate(config, schema);
      }

      if (Y.Object.isEmpty(errors)) {
        inspector.get('env').set_config(
            // When we have a ghost service model this id will have to be the
            // changeSet id so that we know which service to modify.
            service.get('id'),
            config,
            inspector.configFileContent,
            service.get('config'),
            Y.bind(this._setConfigCallback, this, container)
        );
      } else {
        db.notifications.add(
            new models.Notification({
              title: 'Error saving service config',
              message: 'Error saving service config',
              level: 'error'
            })
        );
        // We don't have a story for passing the full error messages
        // through so will log to the console for now.
        console.log('Error setting config', errors);
      }
    },

    /**
      Handles the success or failure of setting the new config values

      @method _setConfigCallback
      @param {Y.Node} container of the viewlet-manager.
      @param {Y.EventFacade} evt YUI event object with the following attrs:
        - err: whether or not an error occurred;
        - service_name: the name of the service;
        - newValues: an object including the modified config options.
    */
    _setConfigCallback: function(container, evt) {
      // If the user has conflicted fields and still chooses to
      // save, then we will be overwriting the values in Juju.
      if (evt.err) {
        var db = this.viewletManager.get('db');
        db.notifications.add(
            new models.Notification({
              title: 'Error setting service configuration',
              message: 'Service name: ' + evt.service_name,
              level: 'error'
            })
        );
        this.onRemoveFile();
      } else if (!this.get('destroyed')) {
        // If the inspector has been destroyed then we don't need to make these
        // changes as the destructor should have cleaned it up.
        this._highlightSaved(container);
        var service = this.viewletManager.get('model');
        // Mix the current config (stored in the db) with the modified options.
        var config = Y.mix(service.get('config'), evt.newValues, true);
        service.set('config', config);
        var bindingEngine = this.viewletManager.bindingEngine;
        bindingEngine.resetDOMToModel('config');
        this.onRemoveFile();
      }
    },

    /**
      Cancel any configuration changes.

      @method cancelConfig
      @param {Y.EventFacade} e An event object.
      @return {undefined} Nothing.
    */
    cancelConfig: function(e) {
      this.onRemoveFile();
      this.viewletManager.bindingEngine.resetDOMToModel('config');
    },

    /**
      Keep checkboxes in sync with their textual representation.

      @method onCheckboxUpdate
      @param {Y.Event} ev the event from the change triggered.

     */
    onCheckboxUpdate: function(ev) {
      var checked = ev.currentTarget.get('checked');
      ev.currentTarget.ancestor('.toggle').one('.textvalue').set('text',
                                                                 checked);
    }
  });

}, '0.0.1', {
  requires: [
    'event-simulate',
    'juju-charm-models',
    'viewlet-base-view',
    'conflict-view-extension',
    'configfile-view-extension',
    'juju-view',
    'node',
    'resizing-textarea'
  ]
});
