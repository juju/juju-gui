'use strict';


/**
 * Provides new tab and tabview widgets with some additional functions for
 * jujugui.
 *
 * @namespace juju
 * @module browser
 * @submodule widgets
 */
YUI().add('browser-tabview', function(Y) {
  var ns = Y.namespace('juju.browser.widgets');

  /**
   * juju.browser.widgets.Tab provides a Tab for use in Tabviews that can
   * accept an arbitrary callback used the first time the tab is selected.
   *
   * @class Y.juju.browser.widgets.Tab
   * @extends {Y.Tab}
   */
  ns.Tab = Y.Base.create('juju-browser-tab', Y.Tab, [], {

    /**
     * Calls the Tab's callback, if it exists and the tab is selected.
     *
     * @method _callbackMaybe
     */
    _callbackMaybe: function() {
      var callback = this.get('callback');
      if (callback && this.get('selected') === 1) {
        callback();
      }
    },

    /**
     * Binds the UI events.
     *
     * @method binUI
     */
    bindUI: function() {
      ns.Tab.superclass.bindUI.apply(this);
      this.get('_events').push(
          this.onceAfter('selectedChange', this._callbackMaybe));
    },

    /**
     * Destructor
     *
     * @method destructor
     */
    destructor: function() {
      Y.Array.each(this.get('_events'), function(e) {
        e.detach();
      });
    }


  }, {
    ATTRS: {
      /**
       * @attribute _events
       * @default []
       * @type {array}
       */
      _events: {
        value: []
      },

      /**
       * @attribute callback
       * @default null
       * @type {function}
       */
      callback: {
        value: null
      }
    }
  });

  /**
   * Tabview provides extra rendering options--it can be rendered with the
   * tabs horizontally rendered like Y.TabView, or vertically.
   *
   * @class Y.juju.browser.widgets.TabView
   * @extends {Y.TabView}
   */
  ns.TabView = Y.Base.create('juju-browser-tabview', Y.TabView, [], {

    /**
     * Renders the DOM nodes for the widget.
     *
     * @method renderUI
     */
    renderUI: function() {
      ns.TabView.superclass.renderUI.apply(this);
      if (this.get('vertical')) {
        this.get('contentBox').addClass('vertical');
      }
    }
  }, {
    ATTRS: {

      /**
       * @attribute defaultChildType
       * @default Y.juju.browser.widgets.Tab
       * @type {Y.Widget}
       */
      defaultChildType: {
        value: ns.Tab
      },

      /**
       * @attribute vertical
       * @default false
       * @type {boolean}
       */
      vertical: {
        value: false
      }
    }
  });

}, '0.1.0', { requires: [
  'array-extras',
  'base',
  'tab',
  'tabview'
]});
