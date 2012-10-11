'use strict';

YUI.add('juju-charm-search', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      // Singleton
      _instance = null;

  var CharmCollectionView = Y.Base.create('CharmCollectionView', Y.View, [], {
    template: views.Templates['charm-search-result'],
    events: {
      'a.charm-detail': {click: 'showDetails'},
      '.charm-entry .btn': {
        click: function(ev) {
          var info_url = ev.currentTarget.getData('info-url');
          // In the future, fire an event to show the configure pane instead.
          this.get('app').fire('showCharm', {charm_data_url: info_url});
        }
      },
      '.charm-entry': {
        mouseenter: function(ev) {
          ev.currentTarget.one('.btn').transition({opacity: 1, duration: 0.25});
        },
        mouseleave: function(ev) {
          ev.currentTarget.one('.btn').transition({opacity: 0, duration: 0.25});
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
          var searchString = 'series%3A'+ev.newVal+'+owner%3Acharmers';
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
          var el = ev.currentTarget.ancestor('.charm-section').one('div'),
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
        panels =
              { charms: charmsSearchPanel,
                description: descriptionPanel },
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

    var handleKeyDown = function (ev) {
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
    'event-key'
  ]
});
