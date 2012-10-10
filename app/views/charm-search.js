'use strict';

YUI.add('juju-charm-search', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      // Singleton
      _instance = null,
      // Delay between a "keyup" event and the service request
      _searchDelay = 500;

  var CharmCollectionView = Y.Base.create('CharmCollectionView', Y.View, [], {
    template: views.Templates['charm-search-result'],
    resultsTemplate: views.Templates['charm-search-result-entries'],
    initializer: function() {
      this.delay = utils.Delayer();
    },
    render: function() {
      // We only need to render once.
      if (!this._rendered) {
        this.get('container').setHTML(this.template({}));
        this._rendered = true;
      }
      return this;
    },
    events: {
      'a.charm-detail': {click: 'showDetails'},
      '.charm-entry .btn.deploy': {click: 'deploy'},
      '.charm-entry .btn.configure': {click: 'showConfiguration'},
      '.charms-search-field-div button.clear': {click: 'clearSearch'},
      '.charms-search-field': {keyup: 'search'},
      '.charm-entry': {
        mouseenter: function(ev) {
          ev.currentTarget.all('.btn').transition({opacity: 1, duration: 0.25});
        },
        mouseleave: function(ev) {
          ev.currentTarget.all('.btn').transition({opacity: 0, duration: 0.25});
        }
      }
    },
    // This is an interface function.
    focus: function(ev) {
      this.get('container').one('.charms-search-field').focus();
    },
    clearSearch: function(ev) {
      var container = this.get('container'),
          searchField = container.one('.charms-search-field');
      this.updateList(null);
      searchField.set('value', '');
      searchField.focus();
    },
    search: function(ev) {
      var field = ev.target;
      this.updateList(null);
      // It delays the search request until the last key is pressed.
      this.delay(
          Y.bind(function() {
            this.findCharms(field.get('value'), Y.bind(function(charms) {
              this.updateList(charms);
            }, this));
          }, this),
          this.get('searchDelay'));
    },
    showDetails: function(ev) {
      ev.halt();
      this.fire(
          'changePanel',
          { name: 'description',
            charmId: ev.target.getAttribute('href') });
    },
    deploy: function(ev) {
      var url = ev.currentTarget.getData('url'),
          name = ev.currentTarget.getData('name'),
          info_url = ev.currentTarget.getData('info-url'),
          app = this.get('app');
      if (Y.Lang.isValue(app.db.services.getById(name))) {
        // A service with the same name already exists.  Send the
        // user to a configuration page.
        app.db.notifications.add(
            new models.Notification({
              title: 'Name already used: ' + name,
              message: 'The service\'s default name is already in ' +
                  'use. Please configure another.',
              level: 'info'
            })
        );
        app.fire('showCharm', {charm_data_url: info_url});
        return;
      }
      // Disable the deploy button.
      var button = ev.currentTarget,
          div = button.ancestor('div'),
          backgroundColor = 'lightgrey',
          oldColor = div.getStyle('backgroundColor');

      button.set('disabled', true);
      div.setStyle('backgroundColor', backgroundColor);

      app.env.deploy(url, name, {}, function(ev) {
        button.set('disabled', false);
        if (ev.err) {
          div.setStyle('backgroundColor', 'pink');
          console.log(url + ' deployment failed');
          app.db.notifications.add(
              new models.Notification({
                title: 'Error deploying ' + name,
                message: 'Could not deploy the requested service.',
                level: 'error'
              })
          );
        } else {
          console.log(url + ' deployed');
          app.db.notifications.add(
              new models.Notification({
                title: 'Deployed ' + name,
                message: 'Successfully deployed the requested service.',
                level: 'info'
              })
          );
        }
        div.transition(
            { easing: 'ease-out', duration: 3, backgroundColor: oldColor},
            function() {
              // Revert to following normal stylesheet rules.
              div.setStyle('backgroundColor', '');
            });
      });
    },
    showConfiguration: function(ev) {
      // Without the stopPropagation the 'outside' click handler is getting
      // called which immediately closes the panel.
      ev.stopPropagation();
      ev.preventDefault();
      this.fire(
          'changePanel',
          { name: 'configuration',
            charmId: ev.currentTarget.getData('url')});
    },
    // Create a data structure friendly to the view
    normalizeCharms: function(charms) {
      var hash = {};
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
      series_names.sort();
      series_names.reverse();
      return Y.Array.map(series_names, function(name) {
        var charms = hash[name];
        charms.sort(function(a, b) { return [a.owner || '', a.name]; });
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
    },
    updateList: function(entries) {
      var container = this.get('container'),
          list = container.one('.search-result-div');
      // Destroy old entries
      list.get('childNodes').remove(true);
      list.append(this.resultsTemplate({charms: entries}));
    }
  });
  views.CharmCollectionView = CharmCollectionView;

  var CharmDescriptionView = Y.Base.create(
      'CharmDescriptionView', Y.View, [views.JujuBaseView], {
        template: views.Templates['charm-description'],
        events: {
          '.charm-nav-back': {click: 'goBack'},
          '.btn': {click: 'deploy'},
          '.charm-section h4': {click: 'toggleSectionVisibility'}
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
              el.ancestor('.charm-section').one('div').hide();
            });
          } else {
            container.setHTML(
                '<div class="alert">Waiting on charm data...</div>');
          }
          return this;
        },
        focus: function() {
          // No op: we don't have anything to focus on.
        },
        goBack: function(ev) {
          ev.halt();
          this.fire('changePanel', { name: 'charms' });
        },
        deploy: function(ev) {
          // Show configuration page for this charm.  For now, this is external.
          var app = this.get('app'),
              info_url = ev.currentTarget.getData('info-url');
          app.fire('showCharm', {charm_data_url: info_url});
        },
        toggleSectionVisibility: function(ev) {
          var el = ev.currentTarget.ancestor('.charm-section').one('.collapsible'),
              icon = ev.currentTarget.one('i');
          if (el.getStyle('display') === 'none') {
            // sizeIn doesn't work smoothly without this bit of jiggery to get
            // accurate heights and widths.
            el.setStyles({height: null, width: null, display: 'block'});
            var config =
                { duration: 0.25,
                  height: el.get('scrollHeight') + 'px',
                  width: el.get('scrollWidth') + 'px'
                };
            // Now we need to set our starting point.
            el.setStyles({height: 0, width: config.width});
            el.show('sizeIn', config);
            icon.replaceClass('icon-chevron-right', 'icon-chevron-down');
          } else {
            el.hide('sizeOut', {duration: 0.25});
            icon.replaceClass('icon-chevron-down', 'icon-chevron-right');
          }
        }
      });

  views.CharmDescriptionView = CharmDescriptionView;

  var CharmConfigurationView = Y.Base.create(
      'CharmCollectionView', Y.View, [views.JujuBaseView], {
        template: views.Templates['charm-pre-configuration'],
        initializer: function() {
          this.bindModelView(this.get('model'));
        },
        render: function() {
          var container = this.get('container'),
              charm = this.get('model');
          if (Y.Lang.isValue(charm)) {
            var settings,
                config = charm.get('config');
            if (Y.Lang.isValue(config)) {
              settings = utils.extractServiceSettings(config.options);
            }
            container.setHTML(this.template(
                { charm: charm.getAttrs(),
                  settings: settings}));
          } else {
            container.setHTML(
                '<div class="alert">Waiting on charm data...</div>');
          }
        },
        focus: function() {
          // We don't have anything to focus on.
        },
        events: {
          '.charm-nav-back': {click: 'goBack'},
          '.btn': {click: 'onCharmDeployClicked'},
          '.charm-section h4': {click: 'toggleSectionVisibility'}
        },
        // TODO this is (almost) a duplicate of the same function in the search
        // pane, unify them.
        toggleSectionVisibility: function(ev) {
          var el = ev.currentTarget.ancestor('.charm-section').one('.collapsible'),
              icon = ev.currentTarget.one('i');
          if (el.getStyle('display') === 'none') {
            // sizeIn doesn't work smoothly without this bit of jiggery to get
            // accurate heights and widths.
            el.setStyles({height: null, width: null, display: 'block'});
            var config =
                { duration: 0.25,
                  height: el.get('scrollHeight') + 'px',
                  width: el.get('scrollWidth') + 'px'
                };
            // Now we need to set our starting point.
            el.setStyles({height: 0, width: config.width});
            el.show('sizeIn', config);
            icon.replaceClass('icon-chevron-right', 'icon-chevron-down');
          } else {
            el.hide('sizeOut', {duration: 0.25});
            icon.replaceClass('icon-chevron-down', 'icon-chevron-right');
          }
        },
        goBack: function(ev) {
          ev.halt();
          this.fire('changePanel', { name: 'charms' });
        },
        onCharmDeployClicked: function(evt) {
          // XXX: Look in utils for validator called 'validate'.
          var container = this.get('container'),
              app = this.get('app'),
              serviceName = container.one('#service-name').get('value'),
              numUnits = container.one('#number-units').get('value'),
              charm = this.get('model'),
              url = charm.get('id'),
              config = utils.getElementsValuesMapping(container,
                  '#service-config .config-field');
          numUnits = parseInt(numUnits, 10);
          app.env.deploy(url, serviceName, config, numUnits, function(ev) {
            if (ev.err) {
              console.log(url + ' deployment failed');
              app.db.notifications.add(
                  new models.Notification({
                    title: 'Error deploying ' + name,
                    message: 'Could not deploy the requested service.',
                    level: 'error'
                  })
              );
            } else {
              console.log(url + ' deployed');
              app.db.notifications.add(
                  new models.Notification({
                    title: 'Deployed ' + name,
                    message: 'Successfully deployed the requested service.',
                    level: 'info'
                  })
              );
            }
          });
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
                searchDelay: testing ? 0 : _searchDelay,
                charmStore: charmStore }),
        descriptionPanelNode = Y.Node.create(),
        descriptionPanel = new CharmDescriptionView(
              { container: descriptionPanelNode,
                app: app }),
        configurationPanelNode = Y.Node.create(),
        configurationPanel = new CharmConfigurationView(
              { container: configurationPanelNode,
                app: app }),
        panels =
              { charms: charmsSearchPanel,
                description: descriptionPanel,
                configuration: configurationPanel },
        isPopupVisible = false,
        trigger = Y.one('#charm-search-trigger'),
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
        newPanel.focus();
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
        panels[activePanelName].focus();
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

    // The public methods
    return {
      hide: hide,
      toggle: toggle,
      show: show,
      node: container
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
    'event-outside'
  ]
});
