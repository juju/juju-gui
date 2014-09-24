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


YUI.add('conflict-view-extension', function(Y) {
  var ns = Y.namespace('juju.viewlets');

  /**
    Extension to allow conflict UI updates for the service config and
    constraints inspector views.

    @class ConflictMixin
  */
  function ConflictViewExtension() {}

  ConflictViewExtension.prototype = {
    /**
     * Reset the given node to not be marked as 'modified' in the UX.
     *
     * Marking checkboxes in the UI is done a little differently and requires
     * condition checking in these helpers.
     *
     * @method _clearModified
     * @param {Y.Node} node of the input to clear.
     *
     */
    '_clearModified': function(node) {
      if (node.getAttribute('type') === 'checkbox') {
        var n = node.ancestor('.toggle').one('.modified');
        if (n) {
          n.remove();
        }

        // If the value isn't modified it can't be in conflict.
        this._clearConflictPending(node);
      } else {
        node.removeClass('modified');
      }
    },

    /**
     * Mark the given node to not be marked as 'modified' in the UX.
     *
     * @method _markModified
     * @param {Y.Node} node of the input to mark.
     *
     */
    '_makeModified': function(node) {
      if (node.getAttribute('type') === 'checkbox') {
        node.ancestor('.toggle').one('label').append(
            Y.Node.create('<span class="modified boolean"/>'));
        this._clearConflictPending(node);
      } else {
        node.addClass('modified');
      }
    },

    /**
     * Reset the given node to not be marked as 'conflict-pending' in the UX.
     *
     * Marking checkboxes in the UI is done a little differently and requires
     * condition checking in these helpers.
     *
     * @method _clearConflictPending
     * @param {Y.Node} node of the input to clear.
     *
     */
    '_clearConflictPending': function(node) {
      if (node.getAttribute('type') === 'checkbox') {
        var n = node.ancestor('.toggle').one('.conflict-pending');
        if (n) {
          n.remove();
        }
      } else {
        node.removeClass('conflict-pending');
      }
    },

    /**
     * Mark the given node to not be marked as 'conflict-pending' in the UX.
     *
     * Marking checkboxes in the UI is done a little differently and requires
     * condition checking in these helpers.
     *
     * @method _makeConflictPending
     * @param {Y.Node} node of the input to mark.
     *
     */
    '_makeConflictPending': function(node) {
      if (node.getAttribute('type') === 'checkbox') {
        node.get('parentNode').prepend(
            Y.Node.create('<span class="conflict-pending boolean"/>'));
      } else {
        node.addClass('conflict-pending');
      }
    },

    /**
     * Reset the given node to not be marked as 'conflict' in the UX.
     *
     * Marking checkboxes in the UI is done a little differently and requires
     * condition checking in these helpers.
     *
     * @method _clearConflict
     * @param {Y.Node} node of the input to clear.
     *
     */
    '_clearConflict': function(node) {
      // Checkboxes don't go to full conflict as there's no UX to choose a
      // value to keep.
      node.removeClass('conflict');
    },

    /**
     * Mark the given node to not be marked as 'conflict' in the UX.
     *
     * Marking checkboxes in the UI is done a little differently and requires
     * condition checking in these helpers.
     *
     * @method _makeConflict
     * @param {Y.Node} node of the input to mark.
     *
     */
    '_makeConflict': function(node) {
      node.addClass('conflict');
    },

    'changed': function(node, key, field) {
      // Not all nodes need to show the conflict ux. This is true when
      // multiple binds to a single model field are set, such as in the
      // checkbox widgets used in the inspector.
      if (node.getData('skipconflictux')) {
        return;
      }
      var controls = this.get('container').one('.controls');
      if (this.changedValues[key]) {
        this._makeModified(node);
        controls.removeClass('closed');
      } else {
        this._clearModified(node);
        // Databinding calls syncedFields if there are no more changed
        // values, and that method is responsible for closing the controls.
      }
    },

    'conflict': function(node, nodeValue, modelValue, resolve) {
      if (nodeValue === modelValue) { return; }
      // Not all nodes need to show the conflict ux. This is true when
      // multiple binds to a single model field are set, such as in the
      // checkbox widgets used in the inspector.
      if (node.getData('skipconflictux')) {
        // We're assuming that another node will handle resolving the
        // field.
        return;
      }
      /**
       Calls the databinding resolve method
       @method sendResolve
      */
      var option;
      var viewlet = this;
      var wrapper = node.ancestor('.settings-wrapper');
      var resolver = wrapper.one('.resolver');
      if (resolver) {
        option = resolver.one('.config-field');
      }
      var handlers = [];

      resolve.cleanup = function() {
        handlers.forEach(function(h) { h.detach();});
        viewlet._clearModified(node);
        viewlet._clearConflictPending(node);
        viewlet._clearConflict(node);
        if (resolver) {
          resolver.addClass('hidden');
        }
      };
      /**
        User selects one of the two conflicting values.

        @method sendResolve
       */
      function sendResolve(e) {
        e.halt(true);
        if (e.currentTarget.hasClass('conflicted-env')) {
          resolve(modelValue);
        } else {
          resolve(node.get('value'));
        }
      }

      /**
        User selects a conflicting field, show the resolution UI

        @method setupResolver
      */
      function setupResolver(e) {
        e.halt(true);
        viewlet._clearConflictPending(node);
        viewlet._makeConflict(node);
        viewlet._makeConflict(option);
        option.setStyle('width', node.get('offsetWidth'));
        option.setHTML(modelValue);
        resolver.removeClass('hidden');
      }

      // On conflict just indicate.
      this._clearModified(node);
      this._makeConflictPending(node);

      if (option) {
        handlers.push(wrapper.delegate(
            'click', setupResolver, '.conflict-pending'));
        handlers.push(wrapper.delegate('click', sendResolve, '.conflict'));
      } else {
        handlers.push(wrapper.delegate(
            'click', sendResolve, '.conflict-pending'));
      }
    },

    /**
      Highlight modified fields to show they have been saved.
      Note that the "modified" class is removed in the syncedFields method.

      @method _highlightSaved
      @param {Y.Node} container The affected viewlet container.
      @return {undefined} Nothing.
    */
    _highlightSaved: function(container) {
      var modified = container.all('.modified');
      modified.addClass('change-saved');
      // If you don't remove the class later, the animation runs every time
      // you switch back to the tab with these fields. Unfortunately,
      // animationend handlers don't work reliably, once you hook them up with
      // the associated custom browser names (e.g. webkitAnimationEnd) on the
      // raw DOM node, so we don't even bother with them.  We just make a
      // timer to remove the class.
      var parentContainer = this.viewletManager.get('container');
      Y.later(1000, modified, function() {
        // Use the modified collection that we originally found, but double
        // check that our expected context is still around.
        if (parentContainer.inDoc() &&
            !container.all('.change-saved').isEmpty()) {
          this.removeClass('change-saved');
        }
      });
    },

    'unsyncedFields': function() {
      var node = this.get('container').one('.controls .confirm');
      if (!node.getData('originalText')) {
        node.setData('originalText', node.getHTML());
      }
      node.setHTML('Overwrite');
    },

    'syncedFields': function() {
      var controls = this.get('container').one('.controls');
      var node = controls.one('.confirm');
      var title = node.getData('originalText');
      if (title) {
        node.setHTML(title);
      }
      controls.addClass('closed');
    }
  };

  ns.ConflictViewExtension = ConflictViewExtension;
});
