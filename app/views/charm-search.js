'use strict';

YUI.add('juju-charm-search', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
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

        delayedFilter = utils.buildDelayedTask();

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
      delayedFilter.delay(function() {
        findCharms(field.get('value'), function(charms) {
          updateList(charms);
        });
      }, _searchDelay);
    });

    // Update position if we resize the window.
    // It tries to keep the popup arrow under the charms search icon.
    Y.on('windowresize', function(e) {
      if (isPopupVisible) {
        updatePopupPosition();
      }
    });

    // It applies special formatting rules
    function normalizeCharms(charms) {
      if (!charms) {
        return charms;
      }

      Y.each(charms, function(charm) {
        if (charm.owner === 'charmers') {
          charm.owner = null;
        }
      });

      return charms;
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
          }
        }});
    }

    function hidePanel() {
      if (isPopupVisible) {
        container.remove();
        isPopupVisible = false;
      }
    }

    function showPanel() {
      if (!isPopupVisible) {
        Y.one(document.body).append(container);
        updatePopupPosition();
        charmsList.one('.charms-search-field').focus();
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

      list.all('.charm-detail').on('click', function(ev) {
        showCharm(ev.target.getAttribute('data-charm-url'));
      });
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
          contentWidth = content.getDOMNode().offsetWidth,
          containerWidth = container.getDOMNode().offsetWidth;

      return {
        x: content.getX() + contentWidth - containerWidth,
        y: pos[1] + 30,
        arrowX: icon.getX() + (icon.getDOMNode().offsetWidth / 2)
      };
    }

    if (Y.one('#charm-search-trigger')) {
      Y.one('#charm-search-trigger').on('click', togglePanel);
    }

    // The public methods
    return {
      hide: hidePanel,
      toggle: togglePanel,
      show: showPanel,
      setSearchDelay: function(delay) {
        _searchDelay = delay;
      },
      getNode: function() {
        return container;
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
        _instance.getNode().remove(true);
        _instance = null;
      }
    }
  };

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'node',
    'handlebars'
  ]
});
