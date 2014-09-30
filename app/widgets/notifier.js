/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
        this.anim = new Y.Anim({
          node: this.get('boundingBox'),
          to: {opacity: 0},
          easing: 'easeIn',
          duration: 0.2
        });
        this.anim.on('end', this.destroy, this);
        this.anim.run();
      } else {
        // Otherwise, just destroy the notification.
        this.destroy();
      }
    },

    /**
      Stops the timer on destroy.

      @method destructor
    */
    destructor: function() {
      if (this.timer) {
        this.timer.stop();
        this.timer = null;
      }
      if (this.anim && this.anim.stop) {
        this.anim.stop();
        this.anim = null;
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
