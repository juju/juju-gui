'use strict';

YUI.add('juju-charm-search', function (Y) {

  var views = Y.namespace('juju.views'),
    utils = Y.namespace('juju.views.utils'),
    Templates = views.Templates,

    // Singleton
    _instance = null,
    _searchDelay = 500;

  function createInstance(config) {

    var charmStore = config.charm_store,
      env = config.env,

      container = Y.Node.create(views.Templates['charm-search-pop']({
        title:'All Charms'
      })),
      charmsList = Y.Node.create(views.Templates['charm-search-result']({})),
      charmDetailTemplate = views.Templates['charm-search-detail'],

      isPopupVisible = false,

      model = (function () {

        function filterRequest(query, callback) {

          charmStore.sendRequest({
            request:'search/json?search_text=' + query,
            callback:{
              'success':function (io_request) {
                var result_set = Y.JSON.parse(
                  io_request.response.results[0].responseText);
                console.log('results update', result_set, this);
                callback(result_set.results);
              },
              'failure':function er(e) {
                console.error(e.error);
              }
            }});
        }


        return {
          filter:function (query, callback) {
            filterRequest(query, callback);
          },
          getByName:function (name, callback) {
            filterRequest(name, function (results) {
              if (results && results.length) {
                callback(results[0]);
              } else {
                callback(null);
              }
            });
          }
        };
      })(),

      delayedFilter = utils.buildDelayedTask();

    // The panes starts with the "charmsList" visible
    container.one('.popover-content').append(charmsList);

    charmsList.one('.clear').on('click', function () {
      updateList(null);
      charmsList.one('.charms-search-field').set('value', '');
    });

    charmsList.one('.charms-search-field').on('keyup', function (ev) {
      updateList(null);

      var field = ev.target;
      delayedFilter.delay(function () {
        filterCharms(field.get('value'));
      }, _searchDelay);
    });

    // Update position if we resize the window
    Y.on('windowresize', function (e) {
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
        list:list,
        children:children
      };
    }

    function updateList(entries) {
      var result = removeSearchEntries(false);

      if (updateList) {
        result.list.append(views.Templates['charm-search-result-entries']({
          charms:entries
        }));

        result.list.all('.charm-result-entry').on('click', function (ev) {
          showCharmDetails(ev.target.getAttribute('name'));
        });

        result.list.all('.charm-result-entry-deploy').on('click', function (ev) {
          deployCharm(ev.target.getAttribute('data-charm-url'));
        });
      }
    }

    function deployCharm(url) {
      env.deploy(url, function (msg) {
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
        x:content.getX() + contentWidth - containerWidth,
        y:pos[1] + 30,
        arrowX:icon.getX() + (icon.getDOMNode().offsetWidth / 2)
      };
    }

    function showCharmDetails(name) {
      updateList(null);

      model.getByName(name, function (bean) {
        var result = Y.Node.create(charmDetailTemplate(bean));

        charmsList.append(result);
      });
    }

    function filterCharms(name) {
      model.filter(name, function (beans) {
        updateList(beans);
      });
    }

    if (Y.one('#charm-search-trigger')) {
      Y.one('#charm-search-trigger').on('click', togglePanel);
    }

    return {
      showPanel:showPanel,
      togglePanel: togglePanel,
      setSearchDelay: function(delay) {
        _searchDelay = delay;
      },
      getNode: function() {
        return container;
      }
    };
  }

  views.CharmSearchPopup = {
    getInstance:function (config) {
      if (!_instance) {
        _instance = createInstance(config);
      }
      return _instance;
    },
    killInstance:function () {
      if (_instance) {
        _instance.getNode().remove(true);
        _instance = null;
      }
    }
  };

}, '0.1.0', {
  requires:[
    'view',
    'juju-view-utils',
    'node',
    'handlebars'
  ]
});
