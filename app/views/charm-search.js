'use strict';

YUI.add('juju-charm-search', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      // Singleton
      _instance = null,
      // Delay before showing tooltip.
      _tooltipDelay = 500;


  var toggleSectionVisibility = function(ev) {
    var el = ev.currentTarget.ancestor('.charm-section')
                .one('.collapsible'),
        icon = ev.currentTarget.one('i');
    icon = ev.currentTarget.one('i');
    if (el.getStyle('height') === '0px') {
      el.show('sizeIn', {duration: 0.25, width: null});
      icon.replaceClass('icon-chevron-right', 'icon-chevron-down');
    } else {
      el.hide('sizeOut', {duration: 0.25, width: null});
      icon.replaceClass('icon-chevron-down', 'icon-chevron-right');
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
          this.findCharms(ev.newVal, function(charms) {
            self.set('resultEntries', charms);
          });
        }
      });
      this.after('defaultSeriesChange', function(ev) {
        this.set('defaultEntries', null);
        if (ev.newVal) {
          var searchString = 'series%3A' + ev.newVal + '+owner%3Acharmers';
          this.findCharms(searchString, function(charms) {
            self.set('defaultEntries', charms);
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
    // Create a data structure friendly to the view
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
    findCharms: function(query, callback) {
      var charmStore = this.get('charmStore'),
          app = this.get('app');
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
            app.db.notifications.add(
                new models.Notification({
                  title: 'Could not retrieve charms',
                  message: e.error,
                  level: 'error'
                })
            );
          }
        }});
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
        tooltipDelay: 0,
        waitingToShow: false,
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
          } else {
            container.setHTML(
                '<div class="alert">Waiting on charm data...</div>');
          }
          return this;
        },
        events: {
          '.charm-nav-back': {click: 'goBack'},
          '.btn': {click: 'onCharmDeployClicked'},
          '.charm-section h4': {click: toggleSectionVisibility}
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
          numUnits = parseInt(numUnits, 10);
          app.env.deploy(url, serviceName, config, numUnits, function(ev) {
            if (ev.err) {
              console.log(url + ' deployment failed');
              app.db.notifications.add(
                  new models.Notification({
                    title: 'Error deploying ' + name,
                    message: 'Could not deploy the requested service.',
                    level: 'error'
                  }));
            } else {
              console.log(url + ' deployed');
              app.db.notifications.add(
                  new models.Notification({
                    title: 'Deployed ' + name,
                    message: 'Successfully deployed the requested service.',
                    level: 'info'
                  })
              );
              // Add service to the db and re-render for immediate display on
              // the front page.
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
            .set('id', 'tooltip')
            .addClass('yui3-widget-bd');

          self.tooltip = new Y.Overlay({ srcNode: '#tooltip',
            visible: false}).plug(Y.Plugin.WidgetAnim);
          self.tooltip.anim.get('animHide').set('duration', 0.01);
          self.tooltip.anim.get('animShow').set('duration', 0.3);
          var cg = container.all('.control-group');
          cg.on('mousemove', function(evt) {
            // Control tool-tips.
            if (self.tooltip.get('visible') === false) {
              Y.one('#tooltip').setStyle('opacity', '0');
              self.tooltip.move([(evt.pageX + 5), (evt.pageY + 5)]);
              Y.one('#tooltip').setStyle('opacity', '1');
            }
            if (self.waitingToShow === false) {
              // Wait half a second, then show tooltip.
              self.tooltip.show();
              setTimeout(function() {
                var tooltip = Y.one('#tooltip');
                if (tooltip) {
                  tooltip.setStyle('opacity', '1');
                  self.tooltip.show();
                }
              }, self.get('tooltipDelay'));

              // While waiting to show tooltip, don't let other
              // mousemoves try to show tooltip too.
              self.waitingToShow = true;

              // Find the tooltip text, the control-description.
              var cg = (evt.target.hasClass('control-group')) ?
                  evt.target :
                  evt.target.ancestor('.control-group'),
                  node = cg.one('.control-description'),
                  text = node.get('text').trim();
              self.tooltip.setStdModContent('body', text);
            }
          });

          cg.on('mouseleave', function(evt) {
            // this check prevents hiding the tooltip
            // when the cursor moves over the tooltip itself
            if ((evt.relatedTarget) &&
                (evt.relatedTarget.hasClass('yui3-widget-bd') === false)) {
              self.tooltip.hide();
              self.waitingToShow = false;
            }
          });

          this.tooltip.render();
        }
      });

  views.CharmConfigurationView = CharmConfigurationView;

  // Creates the "_instance" object
  function createInstance(config) {

    var charmStore = config.charm_store,
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
                app: app,
                tooltipDelay: testing ? 0 : _tooltipDelay}),
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
          var newModel = app.db.charms.getById(config.charmId);
          if (!newModel) {
            newModel = app.db.charms.add({id: config.charmId})
              .load({env: app.env, charm_store: app.charm_store});
          }
          newPanel.set('model', newModel);
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
    'overlay'
  ]
});
