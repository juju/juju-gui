'use strict';


YUI.add('browser-overlay-indicator', function(Y) {
  var sub = Y.Lang.sub,
      ns = Y.namespace('juju.widgets.browser');
  ns.OverlayIndicator = Y.Base.create('overlay-indicator', Y.Widget, [], {

    /**
     * Initializer; hides the indicator on creation.
     *
     * @method initializer
     */
    initializer: function(cfg) {
      this.hide();
    },

    /**
     * Wire up our events listeners.
     *
     * @method _addListeners
     * @private
     */
    _addListeners: function() {
      this.on('visibleChange', function(e) {
        if (e.newVal === true) {
          this.resizeAndReposition();
        }
      }, this);
    },

    /**
     * To prevent having to force call sites to pass in
     * parentNode, we must override YUI's built-in _renderUI
     * method.
     *
     * This is a copy of the YUI method, except for using our
     * own parentNode.  This is needed so the spinner overlays
     * correctly.
     *
     * @method _renderUI
     */
    _renderUI: function() {
      var local_parent = this.get('target').get('parentNode');
      this._renderBoxClassNames();
      this._renderBox(local_parent);
    },

    /**
     * Build the indicator overlay itself.
     *
     * @method renderUI
     */
    renderUI: function() {
      var node_html = '<img src="{src}">';
      var img = Y.Node.create(
          sub(node_html, {src: this.get('loading_image')}));
      this.get('contentBox').append(img);
    },

    /**
     * Sets up event listeners.
     *
     * @method bindUI
     */
    bindUI: function() {
      this._addListeners();
    },

    /**
     * Resize and reposition before we show the overlay,
     * to ensure the overlay always matches its target's size/pos.
     *
     * @method resizeAndReposition
     */
    resizeAndReposition: function() {
      var boundingBox = this.get('boundingBox');
      var target = this.get('target');
      var width = target.get('offsetWidth');
      var height = target.get('offsetHeight');
      boundingBox.set('offsetWidth', width);
      boundingBox.set('offsetHeight', height);
      // Now do position too.
      boundingBox.setXY(target.getXY());
    },

    /**
     * Mark the loading or busy action as in progress,
     * and show the overlay.
     *
     * @method setBusy
     */
    setBusy: function() {
      this.show();
    },

    /**
     * Method called to clear overlay on success.
     *
     * @method success
     */
    success: function() {
      this.hide();
      var callback = this.get('success_action');
      if (typeof callback === 'function') {
        callback.call(this);
      }
    },

    /**
     * Method called to clear overlay on error.
     *
     * @method error
     */
    error: function() {
      this.hide();
      var callback = this.get('error_action');
      if (typeof callback === 'function') {
        callback.call(this);
      }
    }
  }, {
    ATTRS: {
      /**
       * A reference to the node that we're going to overlay.
       *
       * @attribute target
       * @type {Y.Node}
       * @default undefined
       */
      target: {},

      /**
       * Callback to fire upon calling success.
       *
       * @attribute success_action
       * @type {function}
       * @default undefined
       */
      success_action: {},

      /**
       * Callback to fire upon calling error.
       *
       * @attribute error_action
       * @type {function}
       * @default undefined
       */
      error_action: {},

      /**
       * @attribute loading_image
       * @default '/juju-ui/assets/images/loading-spinner.gif'
       * @type {string}
       */
      loading_image: {
        value: '/juju-ui/assets/images/non-sprites/loading-spinner.gif'
      }
    }
  });

  /**
   * Manage indicator instances and make sure they're destroyed.
   *
   * @class IndicatorManager
   *
   */
  ns.IndicatorManager = function() {
    this._initIndicatorManager();
  };

  ns.IndicatorManager.prototype = {
    /**
     * Init during class initialization. Add _indicators and catch destroy
     * event to clean up indicator instances.
     *
     * @method _initIndicatorManager
     * @private
     *
     */
    _initIndicatorManager: function() {
      this._indicators = {};
      this.on('destroy', this._destroyIndicators, this);
    },

    /**
     * On destroy, run destroy on any indicator instances we have. This is a
     * method so we can hook up and test that it's called vs a closure in the
     * init.
     *
     * @method _destroyIndicators
     * @private
     *
     */
    _destroyIndicators: function() {
      Y.Object.each(this._indicators, function(ind, key) {
        ind.destroy();
      });
    },

    /**
     * Show/setBusy an indicator for a given node. If an indicator is already
     * attached then just show it, else create a new indicator instance on the
     * node.
     *
     * @method showIndicator
     * @param {Node} node the node to cover with the indicator.
     *
     */
    showIndicator: function(node) {
      debugger;
      var id = node._yuid;

      if (this._indicators[id]) {
        this._indicators[id].setBusy();
      } else {
        this._indicators[id] = new ns.OverlayIndicator({
          target: node
        });

        this._indicators[id].render();
        this._indicators[id].setBusy();
      }
    },

    /**
     * Helper to make sure we can hide an indicator correctly.
     *
     * @method hideIndicator
     * @param {Node} node the container the indicator is currently over.
     *
     */
    hideIndicator: function(node) {
      var id = node._yuid;
      if (this._indicators[id]) {
        this._indicators[id].success();
      }
    }
  };

}, '0.1.0', { requires: [
  'base',
  'node-screen',
  'widget'
]});
