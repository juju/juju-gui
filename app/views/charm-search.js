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
      this.get('container').setHTML(this.template({}));
    },
    events: {
      'a.charm-detail': {click: 'showDetails'},
      '.charm-entry .btn': {click: 'deploy'},
      '.charms-search-field-div button.clear': {click: 'clearSearch'},
      '.charms-search-field': {keyup: 'search'},
      '.charm-entry': {
        mouseenter: function(ev) {
          ev.currentTarget.one('.btn').transition({opacity: 1, duration: 0.25});
        },
        mouseleave: function(ev) {
          ev.currentTarget.one('.btn').transition({opacity: 0, duration: 0.25});
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
      ev.stopPropagation();
      ev.preventDefault();
      this.showCharm(ev.target.getAttribute('href'));
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
      app.env.deploy(url, name, {}, function(ev) {
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
    },
    showCharm: function(url) {
      var app = this.get('app');
      app.navigate(url);
    }
  });

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
        panels =
              { charms: charmsSearchPanel},
        isPopupVisible = false,
        trigger = Y.one('#charm-search-trigger'),
        activePanelName;

    Y.one(document.body).append(container);
    container.hide();

    // The panels starts with the "charmsSearchPanel" visible.
    // Eventually we will be able to swap internal
    // panels (details panel for example).
    function setPanel(name) {
      if (name !== activePanelName) {
        var newPanel = panels[name];
        if (!Y.Lang.isValue(newPanel)) {
          throw 'Developer error: Unknown panel name ' + name;
        }
        activePanelName = name;
        contentNode.get('children').remove();
        newPanel.render();
        contentNode.append(panels[name].get('container'));
        newPanel.focus();
      }
    }
    setPanel('charms');

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
