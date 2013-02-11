'use strict';

/**
 * Provide the Notifier class.
 *
 * @module widgets
 * @submodule widgets.notifier
 */

YUI.add('notifier', function(Y) {

  var widgets = Y.namespace('juju.widgets');

  /**
   * Display a notification.
   * This is the constructor for the notifier widget.
   *
   * @class Notifier
   */
  function Notifier(config) {
    Notifier.superclass.constructor.apply(this, arguments);
  }

  Notifier.NAME = 'Notifier';
  Notifier.ATTRS = {
    title: {value: ''},
    message: {value: ''},
    timeout: {value: 8000}
  };

  Y.extend(Notifier, Y.Widget, {

    CONTENT_TEMPLATE: null,
    TEMPLATE: Y.namespace('juju.views').Templates.notifier,

    /**
     * Attach the widget bounding box to the DOM.
     * Override to insert new instances before existing ones.
     * This way new notification are displayed on top of the page.
     * The resulting rendering process is also very simplified.
     *
     * @method _renderBox
     * @protected
     * @param {Y.Node object} parentNode The node containing this widget.
     * @return {undefined} Mutates only.
     */
    _renderBox: function(parentNode) {
      parentNode.prepend(this.get('boundingBox'));
    },

    /**
     * Create the nodes required by this widget and attach them to the DOM.
     *
     * @method renderUI
     * @return {undefined} Mutates only.
     */
    renderUI: function() {
      var content = this.TEMPLATE({
        title: this.get('title'),
        message: this.get('message')
      });
      this.get('contentBox').append(content);
    },

    /**
     * Attach event listeners which bind the UI to the widget state.
     * The mouse enter event on a notification node pauses the timer.
     * The mouse click event on a notification destroys the widget.
     *
     * @method bindUI
     * @return {undefined} Mutates only.
     */
    bindUI: function() {
      var contentBox = this.get('contentBox');
      contentBox.on(
          'hover',
          function() {
            if (this.timer) {
              this.timer.pause();
            }
          },
          function() {
            if (this.timer) {
              this.timer.resume();
            }
          },
          this
      );
      contentBox.on('click', function(ev) {
        this.hideAndDestroy();
        ev.halt();
      }, this);
    },

    /**
     * Create and start the timer that will destroy the widget after N seconds.
     *
     * @method syncUI
     * @return {undefined} Mutates only.
     */
    syncUI: function() {
      this.timer = new Y.Timer({
        length: this.get('timeout'),
        repeatCount: 1,
        callback: Y.bind(this.hideAndDestroy, this)
      });
      this.timer.start();
    },

    /**
     * Hide this widget using an animation and destroy the widget at the end.
     *
     * @method hideAndDestroy
     * @return {undefined} Mutates only.
     */
    hideAndDestroy: function() {
      this.timer.stop();
      this.timer = null;
      if (this.get('boundingBox').getDOMNode()) {
        // Animate and destroy the notification if it still exists in the DOM.
        var anim = new Y.Anim({
          node: this.get('boundingBox'),
          to: {opacity: 0},
          easing: 'easeIn',
          duration: 0.2
        });
        anim.on('end', this.destroy, this);
        anim.run();
      } else {
        // Otherwise, just destroy the notification.
        this.destroy();
      }
    }

  });

  widgets.Notifier = Notifier;

}, '0.1.0', {requires: [
  'anim',
  'event',
  'event-hover',
  'handlebars',
  'gallery-timer',
  'juju-templates',
  'node',
  'widget'
]});
