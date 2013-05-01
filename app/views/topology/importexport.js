'use strict';

/**
 * Provide the ImportExportModule  class.
 *
 * @module topology
 * @submodule topology.importexport
 */

YUI.add('juju-topology-importexport', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3');

  /**
   * Handle ImportExport from the Topology.
   *
   * @class ImportExportModule
   */
  var ImportExportModule = Y.Base.create('ImportExportModule',
                                         d3ns.Module, [], {
        events: {
          scene: {
            '.zoom-plane': {
              dragenter: 'ignore',
              dragover: 'ignore',
              drop: 'handleFileDrop'
            }
          }
        },

        /**
         * Ingore some of the drag events.
         * @method ignore
         */
        ignore: function(box, module) {
          var evt = d3.event;
          evt.preventDefault();
          evt.stopPropagation();
        },

        /**
         * Handle file drops with HTML5 reader api
         *
         * @method handleFileDrop
         */
        handleFileDrop: function(box, self) {
          // This handler uses the HTML5 File
          // API for DnD support. This event
          // doesn't properly appear in the YUI
          // event wrrapper so we extract it directly
          // from the DOM event.
          var evt = d3.event,
              topo = self.get('component'),
              notifications = topo.get('db').notifications,
              env = topo.get('env'),
              fileSources = evt._event.dataTransfer.files;

          Y.Array.each(fileSources, function(file) {
            console.log('reader for', file);
            var reader = new FileReader();
            reader.onload = (function(fileData) {
              return function(e) {
                // Import each into the environment
                env.importEnvironment(e.target.result);
                notifications.add({
                  title: 'Imported Environment',
                  message: 'Import from "' + file.name + '" successful',
                  level: 'important'
                });
              };
            })(file);
            reader.readAsText(file);
          });
          evt.preventDefault();
          evt.stopPropagation();
        }
      }, {
        ATTRS: {}

      });
  views.ImportExportModule = ImportExportModule;
}, '0.1.0', {
  requires: [
    'node',
    'event',
    'd3-components',
    'juju-models',
    'juju-env',
    'juju-view-utils'
  ]
});
