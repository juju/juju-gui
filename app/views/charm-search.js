'use strict';

YUI.add('juju-charm-search', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      Templates = views.Templates,

      // Singleton
      _instance = null,

      // Delay between a "keyup" event and the service request
      _searchDelay = 500;

  // Creates the "_instance" object
  function createInstance(config) {

    var charmStore = config.charm_store,
        app = config.app,
        container = Y.Node.create(views.Templates['charm-search-pop']({
          title: 'All Charms'
        })),
        charmsList = Y.Node.create(views.Templates['charm-search-result']({})),
        isPopupVisible = false,
        delayFilter = utils.Delayer(),
        trigger = Y.one('#charm-search-trigger'),
        testing = !!config.testing;

    Y.one(document.body).append(container);
    container.hide();

    // When you click the charm name, show the details.
    charmsList.delegate(
        'click',
        function(ev) {
          ev.preventDefault();
          showCharm(ev.target.getAttribute('href'));
        },
        'a.charm-detail');
    // When you click the deploy button, deploy.
    charmsList.delegate(
        'click',
        function(ev) {
          var url = ev.currentTarget.getData('url'),
              name = ev.currentTarget.getData('name'),
              info_url = ev.currentTarget.getData('info-url');
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
        '.charm-entry .btn');
    // When you hover over the charm, show the deploy button.
    charmsList.delegate(
        'hover',
        function(ev) {
          ev.currentTarget.one('.btn').transition({opacity: 1, duration: 0.25});
        },
        function(ev) {
          ev.currentTarget.one('.btn').transition({opacity: 0, duration: 0.25});
        },
        '.charm-entry');

    // The panes starts with the "charmsList" visible.
    // Eventually we will be able to swap internal
    // panels (details panel for example).
    container.one('.popover-content').append(charmsList);

    // Clear the current search results
    charmsList.one('.clear').on('click', function() {
      updateList(null);

      var searchField = charmsList.one('.charms-search-field');
      searchField.set('value', '');
      searchField.focus();
    });

    charmsList.one('.charms-search-field').on('keyup', function(ev) {
      updateList(null);

      var field = ev.target;
      // It delays the search request until the last key is pressed
      delayFilter(function() {
        findCharms(field.get('value'), function(charms) {
          updateList(charms);
        });
      }, testing ? 0 : _searchDelay);
    });

    // Update position if we resize the window.
    // It tries to keep the popup arrow under the charms search icon.
    Y.on('windowresize', function(e) {
      if (isPopupVisible) {
        updatePopupPosition();
      }
    });

    // Create a data structrure friendly to the view
    function normalizeCharms(charms) {
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
    }

    function findCharms(query, callback) {
      charmStore.sendRequest({
        request: 'search/json?search_text=' + query,
        callback: {
          'success': function(io_request) {
            var result_set = Y.JSON.parse(
                io_request.response.results[0].responseText);
            console.log('results update', result_set);
            callback(normalizeCharms(result_set.results));
          },
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

    function hidePanel() {
      if (isPopupVisible) {
        container.hide((testing ? false : true), {duration: 0.25});
        if (Y.Lang.isValue(trigger)) {
          trigger.one('i').replaceClass(
              'icon-chevron-up', 'icon-chevron-down');
        }
        isPopupVisible = false;
      }
    }

    function showPanel() {
      if (!isPopupVisible) {
        container.setStyles({opacity: 0, display: 'block'});
        updatePopupPosition();
        container.show((testing ? false : true), {duration: 0.25});
        charmsList.one('.charms-search-field').focus();
        if (Y.Lang.isValue(trigger)) {
          trigger.one('i').replaceClass(
              'icon-chevron-down', 'icon-chevron-up');
        }
        isPopupVisible = true;
      }
    }

    function togglePanel() {
      if (isPopupVisible) {
        hidePanel();
      } else {
        showPanel();
      }
    }

    function updateList(entries) {
      var list = charmsList.one('.search-result-div');
      // Destroy old entries
      list.get('childNodes').remove(true);
      list.append(views.Templates['charm-search-result-entries']({
        charms: entries
      }));
    }

    function showCharm(url) {
      app.navigate('/charms/' + url);
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
      trigger.on('click', togglePanel);
    }

    // The public methods
    return {
      hide: hidePanel,
      toggle: togglePanel,
      show: showPanel,
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
    'transition'
  ]
});
