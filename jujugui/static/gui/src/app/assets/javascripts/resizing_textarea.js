'use strict';
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


/**
 Textarea resizing plugin.  Taken from Launchpad.  Original copyright follows.
 Usage example:
    target.plug(Y.juju.plugins.ResizingTextarea, {
      skip_animations: true
    });
 @module juju.plugins
 @submodule ResizingTextarea
 */


/**
 * Copyright 2011 Canonical Ltd. This software is licensed under the
 * GNU Affero General Public License version 3 (see the file LICENSE).
 *
 * Auto Resizing Textarea Widget.
 *
 * Usage:
 *     Y.one('#myid').plug(ResizingTextarea);
 *     Y.one('#settings').plug(ResizingTextarea, {
 *         min_height: 100
 *     });
 *
 *     Y.all('textarea').plug(ResizingTextarea);
 *
 * @module lp.app.formwidgets
 * @submodule resizing_textarea
 */
YUI.add('resizing-textarea', function(Y) {

  var module = Y.namespace('juju.plugins'),
      ResizingTextarea = function(cfg) {
        ResizingTextarea.superclass.constructor.apply(this, arguments);
      };

  ResizingTextarea.NAME = 'resizingTextarea';
  ResizingTextarea.NS = 'resizingTextarea';

  /**
 * ATTRS you can set on initialization to determine how we size the textarea
 */
  ResizingTextarea.ATTRS = {
    /**
     * Get the current elements height. This is READ ONLY.
     *
     * @property height
     */
    height: {
      readOnly: true,
      getter: function() {
        return this.t_area.getStyle('height');
      }
    },

    /**
     * Min height to allow the textarea to shrink to in px.
     *
     * We check if there's a css rule for existing height and make that the
     * min height in case it's there.
     *
     * @property min_height
     */
    min_height: {
      value: 10,

      valueFn: function() {
        var target = this.get('host');
        var css_height = target.getStyle('height');

        return !Y.Lang.isUndefined(css_height) ?
            this._clean_size(css_height) : undefined;
      }
    },

    /**
     * Max height to allow the textarea to grow to in px
     *
     * @property max_height
     */
    max_height: {
      value: 450
    },

    /**
     * single_line says that at the minimum, it should show up as a
     * single-line textarea. This is used by tools such as the inline edit
     * widget.  The value is either falsy or the height in px for the single
     * line.
     *
     * @property single_line
     */
    single_line: {
      value: false
    },

    /**
     * Should we bypass animating changes in height?
     * Mainly used to turn off for testing to prevent needing to set timeouts.
     *
     * @property skip_animations
     */
    skip_animations: {value: false}
  };

  Y.extend(ResizingTextarea, Y.Plugin.Base, {

    // Special css we add to clones to make sure they're hidden from view.
    CLONE_CSS: {
      position: 'absolute',
      height: '1em',
      top: -9999,
      left: -9999,
      opacity: 0,
      overflow: 'hidden',
      resize: 'none'
    },

    // Used to track if we're growing/shrinking for each event fired.
    _prev_scroll_height: 0,

    /**
     * Helper function to turn the string from getComputedStyle to int.
     *
     * Deals with the case where we pass in a value with a px at the end. For
     * instance, if you pass the max size from a computed style call, it'll
     * have xxpx which we want to just pull off.
     */
    _clean_size: function(val) {
      if (Y.Lang.isString(val) && val.indexOf('px') === -1) {
        val.replace('px', '');
      }
      return parseInt(val, 10);
    },

    /**
     * Determine the height of this input for a single line of text.
     *
     * In order to tell, we create a one line clone of our master element and
     * see how tall it is.
     */
    _get_single_line_height: function(node) {
      var clone_one = this._prep_clone(node);
      // Clear any input so we know it's only one line tall.
      clone_one.set('value', 'one');
      node.get('parentNode').appendChild(clone_one);
      var height = clone_one.get('scrollHeight');
      clone_one.remove(true);
      return height;
    },

    /**
     * Prepare a clone node of our input textarea.
     *
     * We need to clear it of specific attributes like id/name and get it out
     * of the way of the tabindex for users.
     *
     * This is reused for both the single line clone and the normal height
     * determining clone nodes we use.
     */
    _prep_clone: function(node) {
      var clone = node.cloneNode(true);
      clone.setStyles(this.CLONE_CSS);
      // remove attributes so we don't accidentally grab this node in the
      // future
      clone.removeAttribute('id');
      clone.removeAttribute('name');
      clone.generateID();
      clone.setAttrs({
        'tabIndex': -1
      });

      return clone;
    },

    /**
     * This is the entry point for the event of change.
     *
     * Here we update the clone and resize based on the update.
     */
    _run_change: function(new_value) {
      // we need to update the clone with the content so it resizes
      this.clone.set('value', new_value);
      this.resize();
    },

    /**
     * Given a node, setup a clone so that we can use it for sizing.
     *
     * We need to copy this, move it way off the screen and setup some css we
     * use to make sure that we match the original as best as possible.
     *
     * This clone is then checked for the size to use.
     */
    _setup_clone: function(node) {
      this.clone = this._prep_clone(node);
      this._update_clone_width();
      node.get('parentNode').append(this.clone);
      return this.clone;
    },

    /**
     * We need to apply some special css to our target we want to resize.
     */
    _setup_css: function() {
      // Don't let this text area be resized in the browser, it'll mess with
      // our calcs and we'll be fighting the whole time for the right size.
      this.t_area.setStyle('resize', 'none');
      this.t_area.setStyle('overflow', 'hidden');

      // We want to add some animation to our adjusting of the size, using
      // css animation to smooth all height changes.
      if (!this.get('skip_animations')) {
        this.t_area.setStyle('transition', 'height 0.3s ease');
        this.t_area.setStyle('-webkit-transition', 'height 0.3s ease');
        this.t_area.setStyle('-moz-transition', 'height 0.3s ease');
      }
    },

    /**
     * Update the css width of the clone node.
     *
     * In the process of page dom manipulation, the width might change based
     * on other nodes showing up and forcing changes due to padding/etc.
     *
     * We'll play safe and just always recalc the width for the clone before
     * we check it's scroll height.
     *
     */
    _update_clone_width: function() {
      this.clone.setStyle('width', this.t_area.getComputedStyle('width'));
    },

    initializer: function(cfg) {
      var that = this;
      this.t_area = this.get('host');

      this.hasFocus = false;

      // We need to clean the px of any defaults passed in.
      this.set('min_height', this._clean_size(this.get('min_height')));
      this.set('max_height', this._clean_size(this.get('max_height')));

      this._setup_css(this.t_area);

      // We need to setup the clone of this node so we can check how big it
      // is, but way off the screen so you don't see it.
      this._setup_clone(this.t_area);

      // Look at adjusting the size on any value change event including
      // pasting and such.
      this.t_area.on('valueChange', function(e) {
        this._run_change(e.newVal);
      }, this);

      // On focus ensure the area is big enough to accomodate the addition of
      // another line so that it won't bounce around.
      this.t_area.on('focus', function(e) {
        this.hasFocus = true;
        this.resize();
      }, this);

      this.t_area.on('blur', function(e) {
        // Change _prev_scroll_height to force a resize.
        this._prev_scroll_height = 0;
        this.hasFocus = false;
        this.resize();
      }, this);

      // We also want to handle adjusting if the user resizes their browser.
      Y.on('windowresize', function(e) {
        that._run_change(that.t_area.get('value'));
      }, this);

      // Init the single line height info.
      if (this.get('single_line')) {
        this._single_line_height = this._get_single_line_height(
            this.t_area
            );
      }

      // Initial sizing in case there's existing content to match to.
      this.resize();
    },

    /**
     * Adjust the size of the textarea as needed.
     *
     * @method resize
     */
    resize: function() {
      // We need to update the clone width in case the node's width has
      // changed.
      this._update_clone_width();
      var scroll_height = this.clone.get('scrollHeight');

      if (this.hasFocus) {
        scroll_height += this._single_line_height;
      }

      if (this.get('single_line') &&
          this._single_line_height >= scroll_height &&
          scroll_height > 0) {
        // Force height if we're only one line and the single_line attr
        // is set.
        this.t_area.setStyles({
          height: this.get('single_line'),
          overflow: 'hidden'
        });
      } else if (this._prev_scroll_height !== scroll_height) {
        // Only update the height if we've changed.
        var new_height = Math.max(
            this.get('min_height'),
            Math.min(scroll_height, this.get('max_height')));
        this.t_area.setStyle('height', new_height);
        this.set_overflow();

        this._prev_scroll_height = scroll_height;
      } else if (this._prev_scroll_height < this.get('min_height')) {
        // This can occur when we go from hidden to not hidden via a
        // parent display setting. The initial height needs to get hit
        // again manually on display.
        this.t_area.setStyle('height', this.get('min_height'));
        this.set_overflow();
        this._prev_scroll_height = this.get('min_height');
      }
    },

    /**
     * Check if we're larger than the max_height setting and enable scrollbar.
     *
     * @method set_overflow
     */
    set_overflow: function() {
      var overflow = 'hidden';

      if (this.clone.get('scrollHeight') >= this.get('max_height')) {
        overflow = 'auto';
      }
      this.t_area.setStyle('overflow', overflow);
    }
  });

  // add onto the namespace
  module.ResizingTextarea = ResizingTextarea;

}, '0.1', {
  'requires': ['plugin', 'node', 'event-valuechange', 'event-resize']
});
