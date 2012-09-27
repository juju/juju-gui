'use strict';

YUI.add('juju-view-charmsearch', function (Y) {

  var views = Y.namespace('juju.views'),
    utils = Y.namespace('juju.views.utils'),

    container = Y.Node.create(views.Templates['charm-search-pop']({
      title:'All Charms'
    })),
    charmsList = Y.Node.create(views.Templates['charm-search-result']({})),
    charmDetailTemplate = views.Templates['charm-search-detail'],

    isPopupVisible = false,

    //XXX replace it by the real thing
    model = TEMP_FAKE_MODEL,

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

  // Toggle the charm search panel
  Y.all('.charm-search-trigger').on('click', function (e) {
    if (isPopupVisible) {
      isPopupVisible = false;
      container.remove(false);

    } else {
      Y.one('#content').append(container);
      isPopupVisible = true;
      updatePopupPosition();
    }
  });

  Y.on('windowresize', function(e) {
    if(isPopupVisible) {
      updatePopupPosition();
    }
  });

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

    if(updateList) {
      result.list.append(views.Templates['charm-search-result-entries']({
        items: entries
      }));

      result.list.all('.charm-result-entry').on('click', function (ev) {
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
      x:content.getX() + contentWidth - containerWidth,
      y:pos[1] + 30,
      arrowX: icon.getX() + (icon.getDOMNode().offsetWidth / 2)
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

}, '0.1.0', {
  requires:[]
});









































//XXX replace it by the real thing
var TEMP_FAKE_MODEL = (function () {

  var data = [
    {
      name:'name a',
      detail:'detail a'
    },
    {
      name:'name b',
      detail:'detail b'
    },
    {
      name:'name c',
      detail:'detail c'
    },
    {
      name:'name d',
      detail:'detail d'
    },
    {
      name:'name e',
      detail:'detail e'
    }
  ];

  return {
    filter:function (name, callback) {
      var regex = new RegExp('^' + name, 'i');
      var result = [];
      for (var i = 0; i < data.length; i++) {
        if (regex.test(data[i].name)) {
          result.push(data[i]);
        }
      }
      callback(result);
    },
    getByName:function (name, callback) {
      for (var i = 0; i < data.length; i++) {
        if (name === data[i].name) {
          callback(data[i]);
          return;
        }
      }
    }
  };
})();