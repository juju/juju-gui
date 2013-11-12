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
 * Provide the notification classes.
 *
 * @module views
 * @submodule views.notifications
 */

YUI.add('juju-notifications', function(Y) {

  var views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      Templates = views.Templates;

  /**
   * Abstract base class used to view a ModelList of notifications.
   *
   * @class NotificationsBaseView
   */
  var NotificationsBaseView = Y.Base.create('NotificationsBaseView',
      Y.View, [views.JujuBaseView], {

        initializer: function() {
          NotificationsView.superclass.constructor.apply(this, arguments);

          var notifications = this.get('notifications'),
              env = this.get('env');

          // Bind view to model list in a number of ways
          notifications.addTarget(this);
          // Re-render the model list changes
          notifications.after('add', this.slowRender, this);
          notifications.after('create', this.slowRender, this);
          notifications.after('remove', this.slowRender, this);
          notifications.after('reset', this.slowRender, this);
          // Bind new notifications to the notifier widget.
          notifications.after('add', this.addNotifier, this);

          // Env connection state watcher
          env.on('connectedChange', this.slowRender, this);
        },

        /**
         * Create and display a notifier widget when a notification is added.
         * The notifier is created only if:
         * - the notifier box exists in the DOM;
         * - the notification is a local one (not related to the delta stream);
         * - the notification is an error.
         *
         * @method addNotifier
         * @param {Object} ev An event object (with a "model" attribute).
         * @return {undefined} Mutates only.
         */
        addNotifier: function(ev) {
          var notification = ev.model,
              notifierBox = Y.one('.notifications-nav .notifier-box');
          // Show error notifications only if the DOM contain the notifier box.
          if (notifierBox &&
              !notification.get('isDelta') &&
              (notification.get('level') === 'error' ||
               notification.get('level') === 'important')) {
            var msg = notification.get('message');
            if (msg) {
              msg = new Y.Handlebars.SafeString(msg);
            }
            new widgets.Notifier({
              title: notification.get('title'),
              message: msg
            }).render(notifierBox);
          }
        },

        /**
         * Select/click on a notice. Currently this just removes it from the
         * model_list.
         *
         * @method notificationSelect
         */
        notificationSelect: function(evt) {
          var notifications = this.get('notifications'),
              target = evt.target,
              model;

          if (!target) {
            return;
          }
          if (target.get('tagName') !== 'LI') {
            target = target.ancestor('li');
          }

          model = notifications.getByClientId(target.get('id'));

          if (this.selection.seen) {
            model.set('seen', true);
          }

          if (this.selection.hide) {
            target.hide(true);
          }
          this.slowRender();
        },

        /**
         * A flow of events can trigger many renders, from the event system
         * we debounce render requests with this method.
         *
         * @method slowRender
         */
        slowRender: function() {
          var self = this,
              container = self.get('container');

          clearTimeout(this._renderTimeout);
          this._renderTimeout = setTimeout(function() {
            if (!container) {
              return;
            }
            self.render();
          }, 200);
        },

        render: function() {
          var container = this.get('container'),
              env = this.get('env'),
              connected = env.get('connected'),
              notifications = this.get('notifications'),
              state,
              open = '',
              btngroup = container.one('.btn-group');

          // Honor the current active state if the view is already
          // rendered
          if (btngroup && btngroup.hasClass('open')) {
            open = 'open';
          }

          // However if the size of the message list is now
          // zero we can close the dialog
          if (notifications.size() === 0) {
            open = '';
          }

          var showable = this.getShowable(),
              show_count = showable.length || 0;

          if (!connected) {
            state = 'btn-warning';
          }
          else if (show_count > 0) {
            state = 'btn-danger';
          } else {
            state = 'btn-info';
          }

          container.setHTML(this.template({
            notifications: showable,
            count: show_count,
            state: state,
            open: open,
            viewAllUri: this.get('nsRouter').url({ gui: '/notifications' })
          }));

          return this;
        }
      }, {
        ATTRS: {
          /**
            Applications router utility methods

            @attribute nsRouter
          */
          nsRouter: {}
        }
      });

  /**
   * The view associated with the notifications indicator.
   *
   * @class NotificationsView
   */
  var NotificationsView = Y.Base.create('NotificationsView',
      NotificationsBaseView,
      [
        Y.Event.EventTracker,
        Y.juju.Dropdown
      ], {
        template: Templates.notifications,

        /*
         * Actions associated with events. In this case selection events
         * represent policy flags inside the 'notificationSelect' callback.
         *
         * :hide: should the selected element be hidden on selection
         */
        selection: {
          hide: false,
          seen: false
        },

        /**
         * @method getShowable
         */
        getShowable: function() {
          var notifications = this.get('notifications');
          return notifications.filter(function(n) {
            return n.get('level') === 'error' && n.get('seen') === false;
          }).map(function(n) {
            return n.getAttrs();
          });
        },

        /**
          Renders the notification view and the dropdown widget.

          @method render
        */
        render: function() {
          NotificationsView.superclass.render.apply(this, arguments);
          // Added by the view-dropdown-extension.js
          this._addDropdownFunc();
          return this;
        }

      });
  views.NotificationsView = NotificationsView;

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'node',
    'handlebars',
    'notifier',
    'view-dropdown-extension',
    'event-tracker'
  ]
});
