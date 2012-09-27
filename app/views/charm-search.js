'use strict';

YUI.add('juju-view-charm-search', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      Templates = views.Templates;

  var buildCharmSearchPopup = function(config) {

    var charmStore = config.charm_store,

        container = Y.Node.create(views.Templates['charm-search-pop']({
          title: 'All Charms'
        })),
        charmsList = Y.Node.create(views.Templates['charm-search-result']({})),
        charmDetailTemplate = views.Templates['charm-search-detail'],

        isPopupVisible = false,

        model = (function() {

          function filterRequest(query, callback) {

            charmStore.sendRequest({
              request: 'search/json?search_text=' + query,
              callback: {
                'success': function(io_request) {
                  var result_set = Y.JSON.parse(
                      io_request.response.results[0].responseText);
                  console.log('results update', result_set, this);
                  callback(result_set.results);
                },
                'failure': function er(e) {
                  console.error(e.error);
                }
              }});
          }


          return {
            filter: function(query, callback) {
              filterRequest(query, callback);
            },
            getByName: function(name, callback) {
              filterRequest(name, function(results) {
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

    charmsList.one('.search-field').on('keypress', function(ev) {
      updateList(null);

      var field = ev.target;
      delayedFilter.delay(function() {
        filterCharms(field.get('value'));
      }, 500);
    });

    // Update position if we resize the window
    Y.on('windowresize', function(e) {
      if (isPopupVisible) {
        updatePopupPosition();
      }
    });

    function togglePanel() {
      if (isPopupVisible) {
        isPopupVisible = false;
        container.remove(false);

      } else {
        Y.one('#content').append(container);
        isPopupVisible = true;
        updatePopupPosition();
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

        result.list.all('.charm-result-entry').on('click', function(ev) {
          showCharmDetails(ev.target.getAttribute('name'));
        });
      }
    }

    function updatePopupPosition() {
      var pos = getCalculatePanelPosition();
      container.setXY([pos.x, pos.y]);
      container.one('.arrow').setX(pos.arrowX);
    }

    function getCalculatePanelPosition() {
      //Y.one('#content')
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

    function showCharmDetails(name) {
      updateList(null);

      model.getByName(name, function(bean) {
        var result = Y.Node.create(charmDetailTemplate(bean));

        charmsList.append(result);
      });
    }

    function filterCharms(name) {
      model.filter(name, function(beans) {
        updateList(beans);
      });
    }

    return {
      togglePanel: togglePanel,
      getNode: function() {
        return container;
      }
    };
  };

  var CharmSearchPopup = Y.Base.create(
      'CharmSearchPopup', Y.View, [views.JujuBaseView], {

        notifyToggle: function(evt) {
          this._instance.togglePanel();
        },

        render: function() {
          if (!this._instance) {
            this._instance = buildCharmSearchPopup({
              charm_store: this.get('charm_store')
            });
            Y.one('#charm-search-trigger').on('click', Y.bind(this.notifyToggle, this));
          }
        }

      });
  views.CharmSearchPopupView = CharmSearchPopup;

}, '0.1.0', {
  requires: []
});
