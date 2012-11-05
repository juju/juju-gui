'use strict';

YUI.add('juju-charm-panel', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      // This will hold objects that can be used to detach the subscriptions
      // when the charm panel is destroyed.
      subscriptions = [],
      // Singleton
      _instance,
      // See https://github.com/yui/yuidoc/issues/25 for issue tracking
      // missing @function tag.
      /**
      A shared listener for click events on headers that open and close
      associated divs.

      It expects the event target to contain an i tag used as a bootstrap
      icon, and to have a parent with the 'charm-section' class.  The parent
      must contain an element with the 'collapsible' class.  The i switches
      back and forth between up and down icons, and the collapsible element
      opens and closes.

      @method toggleSectionVisibility
      @static
      @private
      @return {undefined} Mutates only.
      */
      toggleSectionVisibility = function(ev) {
        var el = ev.currentTarget.ancestor('.charm-section')
                .one('.collapsible'),
            icon = ev.currentTarget.one('i');
        // clientHeight and offsetHeight are not as reliable in tests.
        if (parseInt(el.getStyle('height'), 10) === 0) {
          el.show('sizeIn', {duration: 0.25, width: null});
          icon.replaceClass('icon-chevron-up', 'icon-chevron-down');
        } else {
          el.hide('sizeOut', {duration: 0.25, width: null});
          icon.replaceClass('icon-chevron-down', 'icon-chevron-up');
        }
      },
      /**
      Given a container node and a total height available, set the height of a
      '.charm-panel' node to fill the remaining height available to it within
      the container.  This expects '.charm-panel' node to possibly have
      siblings before it, but not any siblings after it.

      @method setScroll
      @static
      @private
      @return {undefined} Mutates only.
      */
      setScroll = function(container, height) {
        var scrollContainer = container.one('.charm-panel');
        if (scrollContainer && height) {
          var diff = scrollContainer.getY() - container.getY(),
              clientDiff = (
              scrollContainer.get('clientHeight') -
              parseInt(scrollContainer.getComputedStyle('height'), 10)),
              scrollHeight = height - diff - clientDiff;
          scrollContainer.setStyle('height', scrollHeight + 'px');
        }
      },
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
      getInterfaces = function(data) {
        if (data) {
          return Y.Array.map(
              Y.Object.values(data),
              function(val) { return val['interface']; });
        }
      };

  var CharmCollectionView = Y.Base.create('CharmCollectionView', Y.View, [], {
    template: views.Templates['charm-search-result'],
    events: {
      'a.charm-detail': {click: 'showDetails'},
      '.charm-entry .btn.deploy': {click: 'showConfiguration'},
      '.charm-entry': {
        mouseenter: function(ev) {
          ev.currentTarget.all('.btn').transition({opacity: 1, duration: 0.25});
        },
        mouseleave: function(ev) {
          ev.currentTarget.all('.btn').transition({opacity: 0, duration: 0.25});
        }
      }
    },
    // Set searchText to cause the results to be found and rendered.
    // Set defaultSeries to cause all the results for the default series to be
    // found and rendered.
    initializer: function() {
      var self = this;
      this.after('searchTextChange', function(ev) {
        this.set('resultEntries', null);
        if (ev.newVal) {
          this.get('charmStore').find(
              ev.newVal,
              { success: function(charms) {
                self.set('resultEntries', charms);
              },
              failure: Y.bind(this._showErrors, this),
              defaultSeries: this.get('defaultSeries'),
              list: this.get('charms')
              });
        }
      });
      this.after('defaultSeriesChange', function(ev) {
        this.set('defaultEntries', null);
        if (ev.newVal) {
          this.get('charmStore').find(
              {series: ev.newVal, owner: 'charmers'},
              { success: function(charms) {
                self.set('defaultEntries', charms);
              },
              failure: Y.bind(this._showErrors, this),
              defaultSeries: this.get('defaultSeries'),
              list: this.get('charms')
              });
        }
      });
      this.after('defaultEntriesChange', function() {
        if (!this.get('searchText')) {
          this.render();
        }
      });
      this.after('resultEntriesChange', function() {
        this.render();
      });
      this.after('heightChange', this._setScroll);
    },
    render: function() {
      var container = this.get('container'),
          searchText = this.get('searchText'),
          defaultEntries = this.get('defaultEntries'),
          resultEntries = this.get('resultEntries'),
          raw_entries = searchText ? resultEntries : defaultEntries,
          entries = raw_entries && makeRenderableResults(raw_entries);
      container.setHTML(this.template({ charms: entries }));
      this._setScroll();
      return this;
    },
    /**
    When the view's "height" attribute is set, adjust the internal scrollable
    div to have the appropriate height.

    @method _setScroll
    @protected
    @return {undefined} Mutates only.
    */
    _setScroll: function() {
      var container = this.get('container'),
          scrollContainer = container.one('.search-result-div'),
          height = this.get('height');
      if (scrollContainer && height) {
        scrollContainer.setStyle('height', height + 'px');
      }
    },
    showDetails: function(ev) {
      ev.halt();
      this.fire(
          'changePanel',
          { name: 'description',
            charmId: ev.target.getAttribute('href') });
    },
    showConfiguration: function(ev) {
      // Without the ev.halt the 'outside' click handler is getting
      // called which immediately closes the panel.
      ev.halt();
      this.fire(
          'changePanel',
          { name: 'configuration',
            charmId: ev.currentTarget.getData('url')});
    },
    /**
     * Create a data structure friendly to the view
     */
    normalizeCharms: function(charms) {
      var hash = {},
          defaultSeries = this.get('defaultSeries');
      Y.each(charms, function(charm) {
        charm.url = charm.series + '/' + charm.name;
        if (charm.owner === 'charmers') {
          charm.owner = null;
        } else {
          charm.url = '~' + charm.owner + '/' + charm.url;
        }
        charm.url = 'cs:' + charm.url;
        if (!Y.Lang.isValue(hash[charm.series])) {
          hash[charm.series] = [];
        }
        hash[charm.series].push(charm);
      });
      var series_names = Y.Object.keys(hash);
      series_names.sort(function(a, b) {
        if ((a === defaultSeries && b !== defaultSeries) || a > b) {
          return -1;
        } else if ((a !== defaultSeries && b === defaultSeries) || a < b) {
          return 1;
        } else {
          return 0;
        }
      });
      return Y.Array.map(series_names, function(name) {
        var charms = hash[name];
        charms.sort(function(a, b) {
          // If !a.owner, that means it is owned by charmers.
          if ((!a.owner && b.owner) || (a.owner < b.owner)) {
            return -1;
          } else if ((a.owner && !b.owner) || (a.owner > b.owner)) {
            return 1;
          } else if (a.name < b.name) {
            return -1;
          } else if (a.name > b.name) {
            return 1;
          } else {
            return 0;
          }
        });
        return {series: name, charms: hash[name]};
      });
    },
    /**
     * Find charms that match a query.
     */
    findCharms: function(query, callback) {
      var charmStore = this.get('charmStore'),
          db = this.get('db');
      charmStore.sendRequest({
        request: 'search/json?search_text=' + query,
        callback: {
          'success': Y.bind(function(io_request) {
            // To see an example of what is being obtained, look at
            // http://jujucharms.com/search/json?search_text=mysql .
            var result_set = Y.JSON.parse(
                io_request.response.results[0].responseText);
            console.log('results update', result_set);
            callback(this.normalizeCharms(result_set.results));
          }, this),
          'failure': function er(e) {
            console.error(e.error);
            db.notifications.add(
                new models.Notification({
                  title: 'Could not retrieve charms',
                  message: e.error,
                  level: 'error'
                })
            );
          }}});
    },
    _showErrors: function(e) {
      console.error(e.error);
      this.get('db').notifications.add(
          new models.Notification({
            title: 'Could not retrieve charms',
            message: e.error,
            level: 'error'
          })
      );
    }
  });
  views.CharmCollectionView = CharmCollectionView;

  var CharmDescriptionView = Y.Base.create(
      'CharmDescriptionView', Y.View, [views.JujuBaseView], {
        template: views.Templates['charm-description'],
        relatedTemplate: views.Templates['charm-description-related'],
        events: {
          '.charm-nav-back': {click: 'goBack'},
          '.btn': {click: 'deploy'},
          '.charm-section h4': {click: toggleSectionVisibility},
          'a.charm-detail': {click: 'showDetails'}
        },
        initializer: function() {
          this.bindModelView(this.get('model'));
          this.after('heightChange', this._setScroll);
        },
        render: function() {
          var container = this.get('container'),
              charm = this.get('model');
          if (Y.Lang.isValue(charm)) {
            container.setHTML(this.template(charm.getAttrs()));
            container.all('i.icon-chevron-up').each(function(el) {
              el.ancestor('.charm-section').one('div')
                .setStyle('height', '0px');
            });
            var slot = container.one('#related-charms');
            if (slot) {
              this.getRelatedCharms(charm, slot);
            }
          } else {
            container.setHTML(
                '<div class="alert">Waiting on charm data...</div>');
          }
          this._setScroll();
          return this;
        },
        getRelatedCharms: function(charm, slot) {
          var store = this.get('charmStore'),
              defaultSeries = this.get('defaultSeries'),
              list = this.get('charms'),
              self = this,
              query = {
                op: 'union',
                requires: getInterfaces(charm.get('provides')),
                provides: getInterfaces(charm.get('requires'))
              };
          if (query.requires || query.provides) {
            store.find(
              query,
              { success: function(related) {
                  if (charm === self.get('model')){
                    self.renderRelatedCharms(related, slot);
                  }
                },
                failure: function(e) {
                  console.error(e.error);
                  self.get('db').notifications.add(
                      new models.Notification({
                        title: 'Could not retrieve charm data',
                        message: e.error,
                        level: 'error'
                      })
                  );
                },
                defaultSeries: defaultSeries,
                list: list
              });
          } else {
            slot.setHTML('None');
          }
        },
        renderRelatedCharms: function(related, slot) {
          if (related.length) {
            slot.setHTML(this.relatedTemplate(
              {charms: makeRenderableResults(related)}));
            // Make container big enough if it is open.
            if (slot.get('clientHeight') > 0) {
              slot.show('sizeIn', {duration: 0.25, width: null});
            }
          } else {
            slot.setHTML('None');
          }
        },
        /**
        When the view's "height" attribute is set, adjust the internal
        scrollable div to have the appropriate height.

        @method _setScroll
        @protected
        @return {undefined} Mutates only.
        */
        _setScroll: function() {
          setScroll(this.get('container'), this.get('height'));
        },
        goBack: function(ev) {
          ev.halt();
          this.fire('changePanel', { name: 'charms' });
        },
        deploy: function(ev) {
          ev.halt();
          this.fire(
              'changePanel',
              { name: 'configuration',
                charmId: ev.currentTarget.getData('url')});
        },
        showDetails: function(ev) {
          ev.halt();
          this.fire(
              'changePanel',
              { name: 'description',
                charmId: ev.target.getAttribute('href') });
        }
      });

  views.CharmDescriptionView = CharmDescriptionView;

  var CharmConfigurationView = Y.Base.create(
      'CharmConfigurationView', Y.View, [views.JujuBaseView], {
        template: views.Templates['charm-pre-configuration'],
        tooltip: null,
        configFileContent: null,
        initializer: function() {
          this.bindModelView(this.get('model'));
          this.after('heightChange', this._setScroll);
        },
        render: function() {
          var container = this.get('container'),
              charm = this.get('model'),
              config = charm && charm.get('config'),
              settings = config && utils.extractServiceSettings(
                  config.options),
              self = this;
          if (charm && charm.loaded) {
            container.setHTML(this.template(
                { charm: charm.getAttrs(),
                  settings: settings}));
            // Set up entry description overlay.
            this.setupOverlay(container);
            // This does not work via delegation.
            container.one('.charm-panel').after(
                'scroll', Y.bind(this._moveTooltip, this));
          } else {
            container.setHTML(
                '<div class="alert">Waiting on charm data...</div>');
          }
          this._setScroll();
          return this;
        },
        /**
        When the view's "height" attribute is set, adjust the internal
        scrollable div to have the appropriate height.

        @method _setScroll
        @protected
        @return {undefined} Mutates only.
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
          '.config-field': {focus: 'showDescription',
            blur: 'hideDescription'},
          'input.config-field[type=checkbox]':
              {click: function(evt) {evt.target.focus();}}
        },
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
                  y_offset = (tooltipHeight - fieldHeight) / 2;
              this.tooltip.move(  // These are the x, y coordinates.
                  [this.tooltip.panel.getX() - tooltipWidth - 15,
                   this.tooltip.field.getY() - y_offset]);
              if (!this.tooltip.get('visible')) {
                this.tooltip.show();
              }
            }
          } else if (this.tooltip.get('visible')) {
            this.tooltip.hide();
          }
        },
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
        hideDescription: function(evt) {
          this.tooltip.hide();
          delete this.tooltip.field;
        },
        /** Pass clicks on the overlay on to the correct recipient. */
        onOverlayClick: function(evt) {
          var container = this.get('container');
          if (this.configFileContent) {
            this.onFileRemove();
          } else {
            container.one('.config-file-upload-widget').getDOMNode().click();
          }
        },
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
          container.one('.config-file-upload-overlay')
            .setContent('Use configuration file');
        },
        onFileLoaded: function(evt) {
          this.configFileContent = evt.target.result;

          if (!this.configFileContent) {
            // Some file read errors don't go through the error handler as
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
        goBack: function(ev) {
          ev.halt();
          this.fire('changePanel', { name: 'charms' });
        },
        onCharmDeployClicked: function(evt) {
          var container = this.get('container'),
              db = this.get('db'),
              env = this.get('env'),
              serviceName = container.one('#service-name').get('value'),
              numUnits = container.one('#number-units').get('value'),
              charm = this.get('model'),
              url = charm.get('id'),
              config = utils.getElementsValuesMapping(container,
                  '#service-config .config-field');
          // The service names must be unique.  It is an error to deploy a
          // service with same name.
          var existing_service = db.services.getById(serviceName);
          if (Y.Lang.isValue(existing_service)) {
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
                  // Add service to the db and re-render for immediate display
                  // on the front page.
                  var service = new models.Service({
                    id: serviceName,
                    charm: charm.get('id'),
                    unit_count: 0,  // No units yet.
                    loaded: false,
                    config: config
                  });
                  db.services.add([service]);
                  // Force refresh.
                  db.fire('update');
                }
              });
          this.goBack(evt);
        },
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

  // Creates the "_instance" object
  function createInstance(config) {

    var charmStore = config.charm_store,
        charms = new models.CharmList(),
        app = config.app,
        testing = !!config.testing,
        container = Y.Node.create('<div />').setAttribute(
            'id', 'juju-search-charm-panel'),
        charmsSearchPanelNode = Y.Node.create(),
        charmsSearchPanel = new CharmCollectionView(
              { container: charmsSearchPanelNode,
                env: app.env,
                db: app.db,
                charms: charms,
                charmStore: charmStore }),
        descriptionPanelNode = Y.Node.create(),
        descriptionPanel = new CharmDescriptionView(
              { container: descriptionPanelNode,
                env: app.env,
                db: app.db,
                charms: charms,
                charmStore: charmStore }),
        configurationPanelNode = Y.Node.create(),
        configurationPanel = new CharmConfigurationView(
              { container: configurationPanelNode,
                env: app.env,
                db: app.db}),
        panels =
              { charms: charmsSearchPanel,
                description: descriptionPanel,
                configuration: configurationPanel },
        isPanelVisible = false,
        trigger = Y.one('#charm-search-trigger'),
        searchField = Y.one('#charm-search-field'),
        ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter,
        activePanelName;

    Y.one(document.body).append(container);
    container.hide();

    function setPanel(config) {
      var newPanel = panels[config.name];
      if (!Y.Lang.isValue(newPanel)) {
        throw 'Developer error: Unknown panel name ' + config.name;
      }
      activePanelName = config.name;
      container.get('children').remove();
      container.append(panels[config.name].get('container'));
      newPanel.set('height', calculatePanelPosition().height);
      if (config.charmId) {
        newPanel.set('model', null); // Clear out the old.
        var charm = charms.getById(config.charmId);
        if (charm.loaded) {
          newPanel.set('model', charm);
        } else {
          charm.load(charmStore, function(err, response) {
            if (err) {
              console.log('error loading charm', response);
              newPanel.fire('changePanel', {name: 'charms'});
            } else {
              newPanel.set('model', charm);
            }
          });
        }
      } else { // This is the search panel.
        newPanel.render();
      }
    }

    Y.Object.each(panels, function(panel) {
      subscriptions.push(panel.on('changePanel', setPanel));
    });
    // The panel starts with the "charmsSearchPanel" visible.
    setPanel({name: 'charms'});

    // Update position if we resize the window.
    Y.on('windowresize', function(e) {
      if (isPanelVisible) {
        updatePanelPosition();
      }
    });

    function hide() {
      if (isPanelVisible) {
        var headerBox = Y.one('#charm-search-trigger-container'),
            headerSpan = headerBox && headerBox.one('span');
        if (headerBox) {
          headerBox.removeClass('active-border');
          if (headerSpan) {
            headerSpan.addClass('active-border');
          }
        }
        container.hide(!testing, {duration: 0.25});
        if (Y.Lang.isValue(trigger)) {
          trigger.one('i').replaceClass(
              'icon-chevron-up', 'icon-chevron-down');
        }
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
        // windowresize can only be fired with "on," and so we can't know
        // which handler will be fired first.
        updatePanelPosition();
      }
    }));

    function show() {
      if (!isPanelVisible) {
        var headerBox = Y.one('#charm-search-trigger-container'),
            headerSpan = headerBox && headerBox.one('span');
        if (headerBox) {
          headerBox.addClass('active-border');
          if (headerSpan) {
            headerSpan.removeClass('active-border');
          }
        }
        container.setStyles({opacity: 0, display: 'block'});
        container.show(!testing, {duration: 0.25});
        isPanelVisible = true;
        updatePanelPosition();
        if (Y.Lang.isValue(trigger)) {
          trigger.one('i').replaceClass(
              'icon-chevron-down', 'icon-chevron-up');
        }
      }
    }
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

    function updatePanelPosition() {
      // This should only be called when the popup is supposed to be visible.
      // We need to hide the popup before we calculate positions so that it
      // does not cause scrollbars to appear while we are calculating
      // positions.  The temporary scrollbars can cause the calculations to be
      // incorrect.
      container.setStyle('display', 'none');
      var pos = calculatePanelPosition();
      container.setStyle('display', 'block');
      container.setX(pos.x);
      if (pos.height) {
        container.setStyle('height', pos.height + 'px');
        panels[activePanelName].set('height', pos.height);
      }
    }

    function calculatePanelPosition() {
      var headerBox = Y.one('#charm-search-trigger-container'),
          dimensions = utils.getEffectiveViewportSize();
      return { x: headerBox && Math.round(headerBox.getX()),
               height: dimensions.height + 17 };
    }

    if (Y.Lang.isValue(trigger)) {
      subscriptions.push(trigger.on('click', toggle));
    }

    var handleKeyDown = function(ev) {
      if (ev.keyCode === ENTER) {
        ev.halt(true);
        show();
        charmsSearchPanel.set('searchText', ev.target.get('value'));
        setPanel({name: 'charms'});
      }
    };

    if (searchField) {
      subscriptions.push(searchField.on('keydown', handleKeyDown));
    }

    // The public methods
    return {
      hide: hide,
      toggle: toggle,
      show: show,
      node: container,
      setDefaultSeries: function(series) {
        charmsSearchPanel.set('defaultSeries', series);
        descriptionPanel.set('defaultSeries', series);
      }
    };
  }

  // The public methods
  views.CharmPanel = {
    getInstance: function(config) {
      if (!_instance) {
        _instance = createInstance(config);
      }
      return _instance;
    },
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

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
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
