'use strict';

YUI.add('juju-charm-search', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      // Singleton
      _instance = null;

  var toggleSectionVisibility = function(ev) {
    var el = ev.currentTarget.ancestor('.charm-section')
                .one('.collapsible'),
        icon = ev.currentTarget.one('i');
    icon = ev.currentTarget.one('i');
    if (el.getStyle('height') === '0px') {
      el.show('sizeIn', {duration: 0.25, width: null});
      icon.replaceClass('icon-chevron-up', 'icon-chevron-down');
    } else {
      el.hide('sizeOut', {duration: 0.25, width: null});
      icon.replaceClass('icon-chevron-down', 'icon-chevron-up');
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
              defaultSeries: this.get('defaultSeries')
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
              defaultSeries: this.get('defaultSeries')
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
    },
    render: function() {
      var container = this.get('container'),
          searchText = this.get('searchText'),
          defaultEntries = this.get('defaultEntries'),
          resultEntries = this.get('resultEntries'),
          entries = searchText ? resultEntries : defaultEntries;
      container.setHTML(this.template({charms: entries}));
      return this;
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
    _showErrors: function(e) {
      console.error(e.error);
      this.get('app').db.notifications.add(
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
        events: {
          '.charm-nav-back': {click: 'goBack'},
          '.btn': {click: 'deploy'},
          '.charm-section h4': {click: toggleSectionVisibility}
        },
        initializer: function() {
          this.bindModelView(this.get('model'));
        },
        render: function() {
          var container = this.get('container'),
              charm = this.get('model');
          if (Y.Lang.isValue(charm)) {
            container.setHTML(this.template(charm.getAttrs()));
            container.all('i.icon-chevron-right').each(function(el) {
              el.ancestor('.charm-section').one('div')
                .setStyle('height', '0px');
            });
          } else {
            container.setHTML(
                '<div class="alert">Waiting on charm data...</div>');
          }
          return this;
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
        }
      });

  views.CharmDescriptionView = CharmDescriptionView;

  var CharmConfigurationView = Y.Base.create(
      'CharmCollectionView', Y.View, [views.JujuBaseView], {
        template: views.Templates['charm-pre-configuration'],
        tooltip: null,
        configFileContent: null,
        initializer: function() {
          this.bindModelView(this.get('model'));
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
          return this;
        },
        events: {
          '.btn.cancel': {click: 'goBack'},
          '.btn.deploy': {click: 'onCharmDeployClicked'},
          '.remove-config-file': {click: 'onFileRemove'},
          '.charm-section h4': {click: toggleSectionVisibility},
          '.config-file-upload': {change: 'onFileChange'},
          '.config-field': {focus: 'showDescription',
            blur: 'hideDescription'},
          'input.config-field[type=checkbox]':
              {click: function(evt) {evt.target.focus();}}
        },
        _moveTooltip: function() {
          if (Y.DOM.inRegion(
              this.tooltip.field.getDOMNode(),
              this.tooltip.panelRegion,
              true)) {
            var targetRect = this.tooltip.field.getClientRect();
            if (targetRect) {
              var widget = this.tooltip.get('boundingBox'),
                  tooltipWidth = widget.get('clientWidth'),
                  tooltipHeight = widget.get('clientHeight'),
                  y_offset = (tooltipHeight - targetRect.height) / 2;
              this.tooltip.move(  // These are the x, y coordinates.
                  [this.tooltip.panel.getX() - tooltipWidth - 15,
                   targetRect.top - y_offset]);
              if (!this.tooltip.get('visible')) {
                this.tooltip.show();
              }
            }
          } else if (this.tooltip.get('visible')) {
            this.tooltip.hide();
          }
        },
        showDescription: function(evt) {
          //console.log('focus', evt, evt.target.getXY());
          var controlGroup = evt.target.ancestor('.control-group'),
              node = controlGroup.one('.control-description'),
              text = node.get('text').trim();
          //console.log(text);
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
          //console.log('focus', evt, evt.target.getXY());
          this.tooltip.hide();
        },
        onFileChange: function(evt) {
          console.log('onFileChange:', evt);
          this.fileInput = evt.target;
          var file = this.fileInput.get('files').shift(),
              reader = new FileReader();
          reader.onerror = Y.bind(this.onFileError, this);
          reader.onload = Y.bind(this.onFileLoaded, this);
          reader.readAsText(file);
        },
        onFileRemove: function(evt) {
          var container = this.get('container');
          this.configFileContent = null;
          container.one('.remove-config-file').addClass('hidden');
          container.one('.charm-settings').show();
          // Replace the file input node.  There does not appear to be any way
          // to reset the element, so the only option is this rather crude
          // replacement.  It actually works well in practice.
          var button = container.one('.remove-config-file');
          this.fileInput.replace(Y.Node.create('<input type="file"/>')
                                 .addClass('config-file-upload'));
          this.fileInput = container.one('.remove-config-file');
        },
        onFileLoaded: function(evt) {
          this.configFileContent = evt.target.result;

          if (!this.configFileContent) {
            // Some file read errors don't go through the error handler as
            // expected but instead return an empty string.  Warn the user if
            // this happens.
            var app = this.get('app');
            app.db.notifications.add(
                new models.Notification({
                  title: 'Configuration file error',
                  message: 'The configuration file loaded is empty.  ' +
                      'Do you have read access?',
                  level: 'error'
                }));
          }
          this.get('container').one('.charm-settings').hide();
          this.get('container').one('.remove-config-file')
            .removeClass('hidden');
          console.log(this.configFileContent);
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
            var app = this.get('app');
            app.db.notifications.add(
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
              app = this.get('app'),
              serviceName = container.one('#service-name').get('value'),
              numUnits = container.one('#number-units').get('value'),
              charm = this.get('model'),
              url = charm.get('id'),
              config = utils.getElementsValuesMapping(container,
                  '#service-config .config-field');
          // The service names must be unique.  It is an error to deploy a
          // service with same name.
          var existing_service = app.db.services.getById(serviceName);
          if (Y.Lang.isValue(existing_service)) {
            console.log('Attempting to add service of the same name: ' +
                        serviceName);
            app.db.notifications.add(
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
          app.env.deploy(url, serviceName, config, this.configFileContent,
                         numUnits, function(ev) {
                if (ev.err) {
                  console.log(url + ' deployment failed');
                  app.db.notifications.add(
                      new models.Notification({
                        title: 'Error deploying ' + serviceName,
                        message: 'Could not deploy the requested service.',
                        level: 'error'
                      }));
                } else {
                  console.log(url + ' deployed');
                  app.db.notifications.add(
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
                  app.db.services.add([service]);
                  // Force refresh.
                  app.db.fire('update');
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
        container = Y.Node.create(views.Templates['charm-search-pop']({
          title: 'All Charms'
        })),
        contentNode = container.one('.popover-content'),
        charmsSearchPanelNode = Y.Node.create(),
        charmsSearchPanel = new CharmCollectionView(
              { container: charmsSearchPanelNode,
                app: app,
                charmStore: charmStore }),
        descriptionPanelNode = Y.Node.create(),
        descriptionPanel = new CharmDescriptionView(
              { container: descriptionPanelNode,
                app: app }),
        configurationPanelNode = Y.Node.create(),
        configurationPanel = new CharmConfigurationView(
              { container: configurationPanelNode,
                app: app}),
        panels =
              { charms: charmsSearchPanel,
                description: descriptionPanel,
                configuration: configurationPanel },
        isPopupVisible = false,
        trigger = Y.one('#charm-search-trigger'),
        searchField = Y.one('#charm-search-field'),
        ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter,
        activePanelName;

    Y.one(document.body).append(container);
    container.hide();

    function setPanel(config) {
      if (config.name !== activePanelName) {
        var newPanel = panels[config.name];
        if (!Y.Lang.isValue(newPanel)) {
          throw 'Developer error: Unknown panel name ' + config.name;
        }
        activePanelName = config.name;
        contentNode.get('children').remove();
        contentNode.append(panels[config.name].get('container'));
        if (config.charmId) {
          newPanel.set('model', null); // Clear out the old.
          charms.loadOneByBaseId(
              config.charmId,
              { success: function(charm) {newPanel.set('model', charm);},
                failure: function(data) {
                  console.log('error loading charm', data);
                  newPanel.fire('changePanel', {name: 'charms'});
                },
                charm_store: charmStore
              });
        } else { // This is the search panel.
          newPanel.render();
        }
      }
    }

    Y.Object.each(panels, function(panel) {
      panel.on('changePanel', setPanel);
    });
    // The panel starts with the "charmsSearchPanel" visible.
    setPanel({name: 'charms'});

    // Update position if we resize the window.
    // It tries to keep the popup arrow under the charms search icon.
    Y.on('windowresize', function(e) {
      if (isPopupVisible) {
        updatePopupPosition();
      }
    });

    function hide() {
      if (isPopupVisible) {
        container.hide(!testing, {duration: 0.25});
        if (Y.Lang.isValue(trigger)) {
          trigger.one('i').replaceClass(
              'icon-chevron-up', 'icon-chevron-down');
        }
        isPopupVisible = false;
      }
    }
    container.on('clickoutside', hide);

    function show() {
      if (!isPopupVisible) {
        container.setStyles({opacity: 0, display: 'block'});
        updatePopupPosition();
        container.show(!testing, {duration: 0.25});
        if (Y.Lang.isValue(trigger)) {
          trigger.one('i').replaceClass(
              'icon-chevron-down', 'icon-chevron-up');
        }
        isPopupVisible = true;
      }
    }

    function toggle(ev) {
      if (Y.Lang.isValue(ev)) {
        // This is important to not have the clickoutside handler immediately
        // undo a "show".
        ev.halt();
      }
      if (isPopupVisible) {
        hide();
      } else {
        show();
      }
    }

    function updatePopupPosition() {
      var pos = calculatePanelPosition();
      container.setXY([pos.x, pos.y]);
      container.one('.arrow').setX(pos.arrowX);
    }

    function calculatePanelPosition() {
      var icon = Y.one('#charm-search-icon'),
          pos = icon.getXY(),
          content = Y.one('#content'),
          contentWidth = parseInt(content.getComputedStyle('width'), 10),
          containerWidth = parseInt(container.getComputedStyle('width'), 10),
          iconWidth = parseInt(icon.getComputedStyle('width'), 10);
      return {
        x: content.getX() + contentWidth - containerWidth,
        y: pos[1] + 30,
        arrowX: icon.getX() + (iconWidth / 2)
      };
    }

    if (Y.Lang.isValue(trigger)) {
      trigger.on('click', toggle);
    }

    var handleKeyDown = function(ev) {
      if (ev.keyCode === ENTER) {
        ev.halt(true);
        show();
        charmsSearchPanel.set('searchText', ev.target.get('value'));
        setPanel({name: 'charms'});
      }
    };

    var handleFocus = function(ev) {
      if (ev.target.get('value').trim() === 'Search for a charm') {
        ev.target.set('value', '');
      }
    };

    var handleBlur = function(ev) {
      if (ev.target.get('value').trim() === '') {
        ev.target.set('value', 'Search for a charm');
        charmsSearchPanel.set('searchText', '');
      }
    };

    if (searchField) {
      searchField.on('keydown', handleKeyDown);
      searchField.on('blur', handleBlur);
      searchField.on('focus', handleFocus);
    }

    // The public methods
    return {
      hide: hide,
      toggle: toggle,
      show: show,
      node: container,
      setDefaultSeries: function(series) {
        charmsSearchPanel.set('defaultSeries', series);
      }
    };
  }

  // The public methods
  views.CharmSearchPopup = {
    getInstance: function(config) {
      if (!_instance) {
        _instance = createInstance(config);
      }
      return _instance;
    },
    killInstance: function() {
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
    'svg-layouts',
    'dom-core',
    'juju-models'
  ]
});
