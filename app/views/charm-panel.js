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

/**
 * The charm panel views implement the various things shown in the right panel
 * when clicking on the "Charms" label in the title bar, or running a search.
 *
 * @module views
 * @submodule views.charm-panel
 */

YUI.add('juju-charm-panel', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      plugins = Y.namespace('juju.plugins'),
      // This will hold objects that can be used to detach the subscriptions
      // when the charm panel is destroyed.
      subscriptions = [],
      // Singleton
      _instance,

      // See https://github.com/yui/yuidoc/issues/25 for issue tracking
      // missing @function tag.
      /**
       * A shared listener for click events on headers that open and close
       * associated divs.
       *
       * It expects the event target to contain an i tag used as a bootstrap
       * icon, and to have a parent with the 'charm-section' class.  The parent
       * must contain an element with the 'collapsible' class.  The i switches
       * back and forth between up and down icons, and the collapsible element
       * opens and closes.
       *
       * @method toggleSectionVisibility
       * @static
       * @private
       * @return {undefined} Mutates only.
       */
      toggleSectionVisibility = function(ev) {
        var el = ev.currentTarget.ancestor('.charm-section')
                .one('.collapsible'),
            icon = ev.currentTarget.one('i');
        // clientHeight and offsetHeight are not as reliable in tests.
        if (parseInt(el.getStyle('height'), 10) === 0) {
          el.show('sizeIn', {duration: 0.25, width: null});
          icon.replaceClass('chevron_down', 'chevron_up');
        } else {
          el.hide('sizeOut', {duration: 0.25, width: null});
          icon.replaceClass('chevron_up', 'chevron_down');
        }
      },

      /**
       * Given a container node and a total height available, set the height of
       * a '.charm-panel' node to fill the remaining height available to it
       * within the container.  This expects '.charm-panel' node to possibly
       * have siblings before it, but not any siblings after it.
       *
       * @method setScroll
       * @static
       * @private
       * @return {undefined} Mutates only.
       */
      setScroll = function(container, height) {
        var scrollContainer = container.one('.charm-panel');
        if (scrollContainer && height) {
          var diff = scrollContainer.getY() - container.getY(),
              clientDiff = (
              scrollContainer.get('clientHeight') -
              parseInt(scrollContainer.getComputedStyle('height'), 10)),
              scrollHeight = height - diff - clientDiff - 576;
          scrollContainer.setStyle('height', scrollHeight + 'px');
        }
      },

      /**
       * Given a set of entries as returned by the charm store "find"
       * method (charms grouped by series), return the list filtered
       * by 'filter'.
       *
       * @method filterEntries
       * @static
       * @private
       * @param {Array} entries An ordered collection of groups of charms, as
       *   returned by the charm store "find" method.
       * @param {String} filter Either 'all', 'subordinates', or 'deployed'.
       * @param {Object} services The db.services model list.
       * @return {Array} A filtered, grouped set of entries.
       */
      filterEntries = function(entries, filter, services) {
        var deployedCharms;

        /**
         * Filter to determine if a charm is a subordinate.
         *
         * @method isSubFilter
         * @param {Object} charm The charm to test.
         * @return {Boolean} True if the charm is a subordinate.
         */
        function isSubFilter(charm) {
          return !!charm.get('is_subordinate');
        }

        /**
         * Filter to determine if a charm is the same as any
         * deployed services.
         *
         * @method isDeployedFilter
         * @param {Object} charm The charm to test.
         * @return {Boolean} True if the charm matches a deployed service.
         */
        function isDeployedFilter(charm) {
              return deployedCharms.indexOf(charm.get('id')) !== -1;
        }

        var filter_fcn;

        if (filter === 'all') {
          return entries;
        } else if (filter === 'subordinates') {
          filter_fcn = isSubFilter;
        } else if (filter === 'deployed') {
          filter_fcn = isDeployedFilter;
          if (!Y.Lang.isValue(services)) {
            deployedCharms = [];
          } else {
            deployedCharms = services.get('charm');
          }
        } else {
          // This case should not happen.
          return entries;
        }

        var filtered = Y.clone(entries);
        // Filter the charms based on the filter function.
        filtered.forEach(function(series_group) {
          series_group.charms = series_group.charms.filter(filter_fcn);
        });
        // Filter the series group based on the existence of any
        // filtered charms.
        return filtered.filter(function(series_group) {
          return series_group.charms.length > 0;
        });
      },

      /**
       * Given a set of grouped entries as returned by the charm store "find"
       * method, return the same data but with the charms converted into data
       * objects that are more amenable to rendering with handlebars.
       *
       * @method makeRenderableResults
       * @static
       * @private
       * @param {Array} entries An ordered collection of groups of charms, as
       *   returned by the charm store "find" method.
       * @return {Array} An ordered collection of groups of charm data.
       */
      makeRenderableResults = function(entries) {
        return entries.map(
            function(data) {
              return {
                series: data.series,
                charms: data.charms.map(
                    function(charm) { return charm.getAttrs(); })
              };
            });
      },

      /**
       * Given an array of interface data as stored in a charm's "required"
       * and "provided" attributes, return an array of interface names.
       *
       * @method getInterfaces
       * @static
       * @private
       * @param {Array} data A collection of interfaces as stored in a charm's
       *   "required" and "provided" attributes.
       * @return {Array} A collection of interface names extracted from the
       *   input.
       */
      getInterfaces = function(data) {
        if (data) {
          return Y.Array.map(
              Y.Object.values(data),
              function(val) { return val['interface']; });
        }
        return undefined;
      };

  /**
   * Display a charm's configuration panel. It shows editable fields for
   * the charm's configuration parameters, together with a "Cancel" and
   * a "Confirm" button for deployment.
   *
   * @class CharmConfigurationView
   */
  var CharmConfigurationView = Y.Base.create(
      'CharmConfigurationView', Y.View, [views.JujuBaseView], {
        template: views.Templates['charm-pre-configuration'],
        tooltip: null,
        configFileContent: null,

        /**
         * @method CharmConfigurationView.initializer
         */
        initializer: function() {
          this.bindModelView(this.get('model'));
          this.after('heightChange', this._setScroll);
          this.on('panelRemoved', this._clearGhostService);
        },

        /**
         * @method CharmConfigurationView.render
         */
        render: function() {
          var container = this.get('container'),
              charm = this.get('model'),
              options = charm && charm.get('options'),
              settings = options && utils.extractServiceSettings(options),
              self = this;
          if (charm && charm.loaded) {
            container.setHTML(this.template(
                { charm: charm.getAttrs(),
                  settings: settings}));

            // Plug in the textarea resizer.  This action can only done after
            // the container is added to the DOM.
            container.all('textarea.config-field')
              .plug(plugins.ResizingTextarea,
                { max_height: 200,
                  min_height: 28,
                  single_line: 18});

            // Set up entry description overlay.
            this.setupOverlay(container);
            // This does not work via delegation.
            container.one('.charm-panel').after(
                'scroll', Y.bind(this._moveTooltip, this));

            // Create a 'ghost' service to represent what will be deployed.
            var db = this.get('db');
            // Remove the other pending services if required.
            db.services.each(function(service) {
              if (service.get('pending')) {
                service.destroy();
              }
            });
            var serviceCount = db.services.filter(function(service) {
              return service.get('charm') === charm.get('id');
            }).length + 1;
            var ghostService = db.services.create({
              id: '(' + charm.get('package_name') + ' ' + serviceCount + ')',
              annotations: {},
              pending: true,
              charm: charm.get('id'),
              unit_count: 0,  // No units yet.
              loaded: false,
              config: options
            });
            // If we have been given coordinates at which the ghost should be
            // created, respect them.
            var ghostAttributes = this.get('ghostAttributes');
            if (ghostAttributes !== undefined) {
              if (ghostAttributes.coordinates !== undefined) {
                ghostService.set('x', ghostAttributes.coordinates[0]);
                ghostService.set('y', ghostAttributes.coordinates[1]);
              }
              ghostService.set('icon', ghostAttributes.icon);
              // Set the dragged attribute to true so that the x/y coords are
              // stored in annotations as well as on the service box.
              ghostService.set('hasBeenPositioned', true);
            }
            this.set('ghostService', ghostService);
            db.fire('update');
          } else {
            container.setHTML(
                '<div class="alert">Waiting on charm data...</div>');
          }
          this._setScroll();
          return this;
        },

        /**
         * When the view's "height" attribute is set, adjust the internal
         * scrollable div to have the appropriate height.
         *
         * @method _setScroll
         * @protected
         * @return {undefined} Mutates only.
         */
        _setScroll: function() {
          setScroll(this.get('container'), this.get('height'));
        },

        events: {
          '.btn.cancel': {click: 'goBack'},
          '.btn.deploy': {click: 'onCharmDeployClicked'},
          '.charm-section h4': {click: toggleSectionVisibility},
          '.config-file-upload-widget': {change: 'onFileChange'},
          '.config-file-upload-overlay': {click: 'onOverlayClick'},
          '.config-field': {
            focus: 'showDescription',
            blur: 'hideDescription'
          },
          'input.config-field[type=checkbox]': {click: function(evt) {
            evt.target.focus();}},
          '#service-name': {blur: 'updateGhostServiceName'}
        },

        /**
         * Determine the Y coordinate that would center a tooltip on a field.
         *
         * @static
         * @param {Number} fieldY The current Y position of the tooltip.
         * @param {Number} fieldHeight The hight of the field.
         * @param {Number} tooltipHeight The height of the tooltip.
         * @return {Number} New Y coordinate for the tooltip.
         * @method _calculateTooltipY
         */
        _calculateTooltipY: function(fieldY, fieldHeight, tooltipHeight) {
          var y_offset = (tooltipHeight - fieldHeight) / 2;
          return fieldY - y_offset;
        },

        /**
         * Determine the X coordinate that would place a tooltip next to a
         * field.
         *
         * @static
         * @param {Number} fieldX The current X position of the tooltip.
         * @param {Number} tooltipWidth The width of the tooltip.
         * @return {Number} New X coordinate for the tooltip.
         * @method _calculateTooltipX
         */
        _calculateTooltipX: function(fieldX, tooltipWidth) {
          return fieldX - tooltipWidth - 15;
        },

        /**
         * Move a tooltip to its predefined position.
         *
         * @method _moveTooltip
         */
        _moveTooltip: function() {
          if (this.tooltip.field &&
              Y.DOM.inRegion(
              this.tooltip.field.getDOMNode(),
              this.tooltip.panelRegion,
              true)) {
            var fieldHeight = this.tooltip.field.get('clientHeight');
            if (fieldHeight) {
              var widget = this.tooltip.get('boundingBox'),
                  tooltipWidth = widget.get('clientWidth'),
                  tooltipHeight = widget.get('clientHeight'),
                  fieldX = this.tooltip.panel.getX(),
                  fieldY = this.tooltip.field.getY(),
                  tooltipX = this._calculateTooltipX(
                      fieldX, tooltipWidth),
                  tooltipY = this._calculateTooltipY(
                      fieldY, fieldHeight, tooltipHeight);
              this.tooltip.move([tooltipX, tooltipY]);
              if (!this.tooltip.get('visible')) {
                this.tooltip.show();
              }
            }
          } else if (this.tooltip.get('visible')) {
            this.tooltip.hide();
          }
        },

        /**
         * Show the charm's description.
         *
         * @method showDescription
         */
        showDescription: function(evt) {
          var controlGroup = evt.target.ancestor('.control-group'),
              node = controlGroup.one('.control-description'),
              text = node.get('text').trim();
          this.tooltip.setStdModContent('body', text);
          this.tooltip.field = evt.target;
          this.tooltip.panel = this.tooltip.field.ancestor(
              '.charm-panel');
          // Stash for speed.
          this.tooltip.panelRegion = Y.DOM.region(
              this.tooltip.panel.getDOMNode());
          this._moveTooltip();
        },

        /**
         * Hide the charm's description.
         *
         * @method hideDescription
         */
        hideDescription: function(evt) {
          this.tooltip.hide();
          delete this.tooltip.field;
        },

        /**
         * Pass clicks on the overlay on to the correct recipient.
         * The recipient can be the upload widget or the file remove one.
         *
         * @method onOverlayClick
         * @param {Object} evt An event object.
         * @return {undefined} Dispatches only.
         */
        onOverlayClick: function(evt) {
          var container = this.get('container');
          if (this.configFileContent) {
            this.onFileRemove();
          } else {
            container.one('.config-file-upload-widget').getDOMNode().click();
          }
        },

        /**
         * Handle the file upload click event.
         * Call onFileLoaded or onFileError if an error occurs during upload.
         *
         * @method onFileChange
         * @param {Object} evt An event object.
         * @return {undefined} Mutates only.
         */
        onFileChange: function(evt) {
          var container = this.get('container');
          console.log('onFileChange:', evt);
          this.fileInput = evt.target;
          var file = this.fileInput.get('files').shift(),
              reader = new FileReader();
          container.one('.config-file-name').setContent(file.name);
          reader.onerror = Y.bind(this.onFileError, this);
          reader.onload = Y.bind(this.onFileLoaded, this);
          reader.readAsText(file);
          container.one('.config-file-upload-overlay')
            .setContent('Remove file');
        },

        /**
         * Handle the file remove click event.
         * Restore the file upload widget on click.
         *
         * @method onFileRemove
         * @return {undefined} Mutates only.
         */
        onFileRemove: function() {
          var container = this.get('container');
          this.configFileContent = null;
          container.one('.config-file-name').setContent('');
          container.one('.charm-settings').show();
          // Replace the file input node.  There does not appear to be any way
          // to reset the element, so the only option is this rather crude
          // replacement.  It actually works well in practice.
          this.fileInput.replace(Y.Node.create('<input type="file"/>')
                                 .addClass('config-file-upload-widget'));
          this.fileInput = container.one('.config-file-upload-widget');
          var overlay = container.one('.config-file-upload-overlay');
          overlay.setContent('Use configuration file');
          // Ensure the charm section height is correctly restored.
          overlay.ancestor('.collapsible')
            .show('sizeIn', {duration: 0.25, width: null});
        },

        /**
         * Callback called when a file is correctly uploaded.
         * Hide the charm configuration section.
         *
         * @method onFileLoaded
         * @param {Object} evt An event object.
         * @return {undefined} Mutates only.
         */
        onFileLoaded: function(evt) {
          this.configFileContent = evt.target.result;

          if (!this.configFileContent) {
            // Some file read errors do not go through the error handler as
            // expected but instead return an empty string.  Warn the user if
            // this happens.
            var db = this.get('db');
            db.notifications.add(
                new models.Notification({
                  title: 'Configuration file error',
                  message: 'The configuration file loaded is empty.  ' +
                      'Do you have read access?',
                  level: 'error'
                }));
          }
          this.get('container').one('.charm-settings').hide();
        },

        /**
         * Callback called when an error occurs during file upload.
         * Hide the charm configuration section.
         *
         * @method onFileError
         * @param {Object} evt An event object (with a "target.error" attr).
         * @return {undefined} Mutates only.
         */
        onFileError: function(evt) {
          console.log('onFileError:', evt);
          var msg;
          switch (evt.target.error.code) {
            case evt.target.error.NOT_FOUND_ERR:
              msg = 'File not found';
              break;
            case evt.target.error.NOT_READABLE_ERR:
              msg = 'File is not readable';
              break;
            case evt.target.error.ABORT_ERR:
              break; // noop
            default:
              msg = 'An error occurred reading this file.';
          }
          if (msg) {
            var db = this.get('db');
            db.notifications.add(
                new models.Notification({
                  title: 'Error reading configuration file',
                  message: msg,
                  level: 'error'
                }));
          }
          return;
        },

        /**
         * Fires an event indicating that the charm panel should switch to the
         * "charms" search result view. Called upon clicking the "Cancel"
         * button.
         *
         * @method goBack
         * @param {Object} ev An event object (with a "halt" method).
         * @return {undefined} Sends a signal only.
         */
        goBack: function(ev) {
          ev.halt();
          this.fire('close');
        },

        /**
         * Clears the ghost service from the database and updates the canvas.
         *
         * @method _clearGhostService
         * @param {Object} ev An event object.
         * @return {undefined} Side effects only.
         */
        _clearGhostService: function(ev) {
          // Remove the ghost service from the environment.
          var db = this.get('db');
          var ghostService = this.get('ghostService');
          if (Y.Lang.isValue(ghostService)) {
            db.services.remove(ghostService);
            db.fire('update');
          }
        },

        /**
         * Updates the ghost service's ID to reflect the service-name field.
         *
         * @method updateGhostServiceName
         * @param {Object} evt The event that's fired.
         * @return {undefined} Side effects only.
         */
        updateGhostServiceName: function(evt) {
          var ghostService = this.get('ghostService');
          var container = this.get('container');
          var db = this.get('db');
          ghostService.set('id', '(' +
              container.one('#service-name').get('value') + ')');
          db.fire('update');
        },

        /**
         * Called upon clicking the "Confirm" button.
         *
         * @method onCharmDeployClicked
         * @param {Object} ev An event object (with a "halt" method).
         * @return {undefined} Sends a signal only.
         */
        onCharmDeployClicked: function(evt) {
          var container = this.get('container');
          var db = this.get('db');
          var ghostService = this.get('ghostService');
          var env = this.get('env');
          var serviceName = container.one('#service-name').get('value');
          var numUnits = container.one('#number-units').get('value');
          var charm = this.get('model');
          var url = charm.get('id');
          var config = utils.getElementsValuesMapping(container,
              '#service-config .config-field');
          var self = this;
          var buttons = container.one('.charm-panel-configure-buttons');
          // The service names must be unique.  It is an error to deploy a
          // service with same name (but ignore the ghost service).
          var existing_service = db.services.getById(serviceName);
          if (Y.Lang.isValue(existing_service) &&
              existing_service !== ghostService) {
            console.log('Attempting to add service of the same name: ' +
                        serviceName);
            db.notifications.add(
                new models.Notification({
                  title: 'Attempting to deploy service ' + serviceName,
                  message: 'A service with that name already exists.',
                  level: 'error'
                }));
            return;
          }
          // Disable the buttons to prevent clicking again.
          buttons.all('.btn').set('disabled', true);
          if (this.configFileContent) {
            config = null;
          }
          numUnits = parseInt(numUnits, 10);
          env.deploy(url, serviceName, config, this.configFileContent,
              numUnits, function(ev) {
                if (ev.err) {
                  console.log(url + ' deployment failed');
                  db.notifications.add(
                      new models.Notification({
                        title: 'Error deploying ' + serviceName,
                        message: 'Could not deploy the requested service.',
                        level: 'error'
                      }));
                } else {
                  console.log(url + ' deployed');
                  db.notifications.add(
                      new models.Notification({
                        title: 'Deployed ' + serviceName,
                        message: 'Successfully deployed the requested service.',
                        level: 'info'
                      })
                  );
                  // Update the annotations with the box's x/y coordinates if
                  // they have been set by dragging the ghost.
                  if (ghostService.get('hasBeenPositioned')) {
                    env.update_annotations(
                        serviceName, 'service',
                        { 'gui-x': ghostService.get('x'),
                          'gui-y': ghostService.get('y') },
                        function() {
                          // Make sure that annotations are set on the ghost
                          // service before they come back from the delta to
                          // prevent the service from jumping to the middle of
                          // the canvas and back.
                          var annotations = ghostService.get('annotations');
                          if (!annotations) {
                            annotations = {};
                          }
                          Y.mix(annotations, {
                            'gui-x': ghostService.get('x'),
                            'gui-y': ghostService.get('y')
                          });
                          ghostService.set('annotations', annotations);
                          // The x/y attributes need to be removed to prevent
                          // lingering position problems after the service is
                          // positioned by the update code.
                          ghostService.removeAttr('x');
                          ghostService.removeAttr('y');
                        });
                  }
                  // Update the ghost service to match the configuration.
                  ghostService.setAttrs({
                    id: serviceName,
                    charm: charm.get('id'),
                    unit_count: 0,  // No units yet.
                    loaded: false,
                    pending: false,
                    config: config
                  });
                  // Force refresh.
                  db.fire('update');
                  self.set('ghostService', null);
                }
                self.goBack(evt);
              });
        },

        /**
         * Setup the panel overlay.
         *
         * @method setupOverlay
         * @param {Object} container The container element.
         * @return {undefined} Side effects only.
         */
        setupOverlay: function(container) {
          var self = this;
          container.appendChild(Y.Node.create('<div/>'))
            .set('id', 'tooltip');
          self.tooltip = new Y.Overlay({ srcNode: '#tooltip',
            visible: false});
          this.tooltip.render();
        }
      });
  views.CharmConfigurationView = CharmConfigurationView;

  /**
   * Create the "_instance" object.
   *
   * @method createInstance
   */
  function createInstance(config) {

    var charms = new models.CharmList(),
        app = config.app,
        container = Y.Node.create('<div />').setAttribute(
            'id', 'juju-search-charm-panel'),
        configurationPanelNode = Y.Node.create(),
        configurationPanel = new CharmConfigurationView(
              { container: configurationPanelNode,
                env: app.env,
                db: app.db}),
        panels = { configuration: configurationPanel },
        // panelHeightOffset takes into account the height of the
        // charm filter picker widget, which only appears on the
        // "charms" panel.
        panelHeightOffset = {
          charms: 33,
          description: 0,
          configuration: 0},
        isPanelVisible = false,
        ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter,
        activePanelName;

    Y.one(config.container || document.body).append(container);
    container.hide();

    /**
      Setter method for public access.

      @method setActivePanelName
      @param {String} name of the panel.
    */
    function setActivePanelName(name) {
      activePanelName = name;
    }

    /**
     * Setup the panel data.
     *
     * @method setPanel
     */
    function setPanel(config) {
      var newPanel = panels[config.name];
      if (!Y.Lang.isValue(newPanel)) {
        throw 'Developer error: Unknown panel name ' + config.name;
      }
      if (activePanelName) {
        // Give to the old panel the possibility to clean things up.
        panels[activePanelName].fire('panelRemoved');
      }
      activePanelName = config.name;
      container.get('children').remove();
      container.append(panels[config.name].get('container'));
      newPanel.set('height', calculatePanelPosition().height -
                   panelHeightOffset[activePanelName] - 1);
      if (config.charmId) {
        newPanel.set('ghostAttributes', config.ghostAttributes);
        newPanel.set('model', null); // Clear out the old.
        var charm = charms.getById(config.charmId);
        newPanel.set('model', charm);
      } else {
        // This is the search panel.
        newPanel.render();
      }
    }

    Y.Object.each(panels, function(panel) {
      subscriptions.push(panel.on('close', function() {
        app.db.services.each(function(service) {
          if (service.get('pending')) {
            service.destroy();
          }
        });
        hide();
        panel._clearGhostService();
      }, this));
    });

    /**
     * Hide the charm panel.
     * Set isPanelVisible to false.
     *
     * @method hide
     * @return {undefined} Mutates only.
     */
    function hide() {
      if (isPanelVisible) {
        container.hide();
        isPanelVisible = false;
      }
    }
    subscriptions.push(container.on('clickoutside', hide));
    subscriptions.push(Y.on('beforePageSizeRecalculation', function() {
      container.setStyle('display', 'none');
    }));
    subscriptions.push(Y.on('afterPageSizeRecalculation', function() {
      if (isPanelVisible) {
        // We need to do this both in windowresize and here because
        // windowresize can only be fired with "on," and so we cannot know
        // which handler will be fired first.
        updatePanelPosition();
      }
    }));

    /**
     * Show the charm panel.
     * Set isPanelVisible to true.
     *
     * @method show
     * @return {undefined} Mutates only.
     */
    function show() {
      if (!isPanelVisible) {
        container.setStyles({opacity: 0, display: 'block'});
        container.show(true);
        isPanelVisible = true;
        if (app.views.environment.instance) {
          app.views.environment.instance.topo.fire('clearState');
        }
        updatePanelPosition();
      }
    }

    /**
     * Show the deploy/configuration panel for a charm.
     *
     * @method deploy
     * @param {String} charmUrl The URL of the charm to configure/deploy.
     * @return {undefined} Nothing.
     */
    function deploy(charm, ghostAttributes, _setPanel) {
      _setPanel = _setPanel || setPanel; // Injection point for tests.
      // Any passed-in charm is fully loaded but the caller doesn't know about
      // the charm panel's internal detail of marking loaded charms, so we will
      // do the marking here.
      charm.loaded = true;
      charms.add(charm);
      // Show the configuration panel.
      _setPanel({
        name: 'configuration',
        charmId: charm.get('id'),
        ghostAttributes: ghostAttributes
      });
      // Since we are showing the configure/deploy panel ex nihilo, we want the
      // panel to disappear when the deploy completes or is canceled, but just
      // this once (i.e., they should work normally if the user opens the panel
      // via a charm search).
      panels.configuration.once('panelRemoved', hide);
      show();
    }

    /**
     * Show the charm panel if it is hidden, hide it otherwise.
     *
     * @method toggle
     * @param {Object} ev An event object (with a "halt" method).
     * @return {undefined} Dispatches only.
     */
    function toggle(ev) {
      if (Y.Lang.isValue(ev)) {
        // This is important to not have the clickoutside handler immediately
        // undo a "show".
        ev.halt();
      }
      if (isPanelVisible) {
        hide();
      } else {
        show();
      }
    }

    /**
     * Update the panel position.
     *
     * This should only be called when the popup is supposed to be visible.
     * We need to hide the popup before we calculate positions, so that it
     * does not cause scrollbars to appear while we are calculating
     * positions.  The temporary scrollbars can cause the calculations to
     * be incorrect.
     *
     * @method updatePanelPosition
     * @return {undefined} Nothing.
     */
    function updatePanelPosition() {
      container.setStyle('display', 'none');
      var pos = calculatePanelPosition();
      container.setStyle('display', 'block');
      if (pos.height) {
        var height = pos.height - panelHeightOffset[activePanelName];
        container.setStyle('height', pos.height + 'px');
        panels[activePanelName].set('height', height - 1);
      }
    }

    /**
     * Calculate the panel position.
     *
     * @method calculatePanelPosition
     */
    function calculatePanelPosition() {
      var headerBox = Y.one('#charm-search-trigger-container'),
          dimensions = utils.getEffectiveViewportSize();
      return { x: headerBox && Math.round(headerBox.getX()),
               height: dimensions.height };
    }

    // The public methods.
    return {
      hide: hide,
      toggle: toggle,
      show: show,
      node: container,
      deploy: deploy,
      setActivePanelName: setActivePanelName
    };
  }

  // The public methods.
  views.CharmPanel = {

    /**
     * Get the instance, creating it if it does not yet exist.
     *
     * @method getInstance
     */
    getInstance: function(config) {
      if (!_instance) {
        _instance = createInstance(config);
      }
      return _instance;
    },

    /**
     * Destroy the instance and its node, detaching all subscriptions.
     *
     * @method getInstance
     */
    killInstance: function() {
      while (subscriptions.length) {
        var sub = subscriptions.pop();
        if (sub) { sub.detach(); }
      }
      if (_instance) {
        _instance.node.remove(true);
        _instance = null;
      }
    }
  };

  // Exposed for testing.
  views.filterEntries = filterEntries;

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'juju-templates',
    'resizing-textarea',
    'node',
    'handlebars',
    'event-hover',
    'transition',
    'event-key',
    'event-outside',
    'widget-anim',
    'overlay',
    'dom-core',
    'juju-models',
    'event-resize'
  ]
});
