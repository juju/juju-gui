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
        // app.env object
        env = config.env,

        container = Y.Node.create(views.Templates['charm-search-pop']({
          title: 'All Charms'
        })),
        charmsList = Y.Node.create(views.Templates['charm-search-result']({})),

        isPopupVisible = false,

        // This is the internal model object.
        // It handles the charm_store requests.
        model = (function() {

          // It applies special formatting rules
          function normalizeBeans(beans) {
            if (!beans) {
              return beans;
            }

            var bean = null;
            for (var index = 0; index < beans.length; index = index + 1) {
              bean = beans[index];
              if (bean.owner === 'charmers') {
                bean.owner = null;
              }
            }

            return beans;
          }

          function filterRequest(query, callback) {
            charmStore.sendRequest({
              request: 'search/json?search_text=' + query,
              callback: {
                'success': function(io_request) {
                  var result_set = Y.JSON.parse(
                      io_request.response.results[0].responseText);
                  console.log('results update', result_set, this);
                  callback(normalizeBeans(result_set.results));
                },
                'failure': function er(e) {
                  console.error(e.error);
                }
              }});
          }

          return {
            filter: function(query, callback) {
              filterRequest(query, callback);
            }
          };
        })(),

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
        filterCharms(field.get('value'));
      }, _searchDelay);
    });

    // Update position if we resize the window.
    // It tries to keep the popup arrow under the charms search icon.
    Y.on('windowresize', function(e) {
      if (isPopupVisible) {
        updatePopupPosition();
      }
    });

    function togglePanel() {
      if (isPopupVisible) {
        showPanel(false);

      } else {
        showPanel(true);
      }
    }

    function showPanel(showIt) {
      if (showIt && isPopupVisible) {
        return;
      }

      if (!showIt && !isPopupVisible) {
        return;
      }

      if (showIt) {
        Y.one(document.body).append(container);
        isPopupVisible = true;
        updatePopupPosition();

        charmsList.one('.charms-search-field').focus();

      } else {
        isPopupVisible = false;
        container.remove(false);

      }
    }

    function removeSearchEntries(destroy) {
      var list = charmsList.one('.search-result-div');
      var children = list.get('childNodes').remove(destroy);
      return {
        list: list,
        children: children
      };
    }

    function updateList(entries) {
      var result = removeSearchEntries(false);

      if (updateList) {
        result.list.append(views.Templates['charm-search-result-entries']({
          charms: entries
        }));

        result.list.all('.charm-result-entry-deploy').on('click', function(ev) {
          deployCharm(ev.target.getAttribute('data-charm-url'));
        });
      }
    }

    function deployCharm(url) {
      env.deploy(url, function(msg) {
        console.log(url + ' deployed');
      });
    }

    function updatePopupPosition() {
      var pos = getCalculatePanelPosition();
      container.setXY([pos.x, pos.y]);
      container.one('.arrow').setX(pos.arrowX);
    }

    function getCalculatePanelPosition() {

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

    function filterCharms(name) {
      model.filter(name, function(beans) {
        updateList(beans);
      });
    }

    if (Y.one('#charm-search-trigger')) {
      Y.one('#charm-search-trigger').on('click', togglePanel);
    }

    // The public methods
    return {
      showPanel: showPanel,
      togglePanel: togglePanel,
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
