'use strict';

YUI.add('juju-notifications', function (Y) {

    var views = Y.namespace('juju.views'),
        Templates = views.Templates;

    /*
     * View a ModelList  of notifications
     */
    var NotificationsView = Y.Base.create('NotificationsView', Y.View, [
            views.JujuBaseView], {
        template: Templates.notifications,

        /*
         * Actions associated with events 
         * in this case selection events represent 
         * policy flags inside the 'notice_select' callback.
         * 
         * :hide: should the selected element be hidden on selection
         */
        selection: {
            hide: true
        },

        events: {
            '#notify-indicator': {
                click: 'notify_toggle'
            },
            '.notice': {
                click: 'notice_select'
            }
        },

        initializer: function () {
            NotificationsView.superclass.constructor.apply(this, arguments);

            var notifications = this.get('notifications'),
                env = this.get('env');

            // Bind view to model list in a number of ways
            notifications.addTarget(this);
            // Re-render the model list changes
            notifications.after('add', this.slow_render, this);
            notifications.after('create', this.slow_render, this);
            notifications.after('remove', this.slow_render, this);
            notifications.after('reset', this.slow_render, this);

            // Env connection state watcher
            env.on('connectedChange', this.slow_render, this);

        },

        /*
         * Event handler for clicking the notification icon.
         */
        notify_toggle: function (evt) {
            var container = this.get('container'),
                notifications = this.get('notifications'),
                target = evt.target.getAttribute('data-target'),
                el = container.one('#' + target),
                parent = el.ancestor();

            if (notifications.size() === 0) {
                return;
            }

            if (parent && parent.hasClass('open')) {
                el.hide(true);
            }
            else {
                el.show(true);
            }

            if (parent) {
                parent.toggleClass('open');
            }

            el.toggleClass('active');

        },

        /*
         * Select/click on a notice. Currently this just removes it from the
         * model_list
         */
        notice_select: function (evt) {
            var notifications = this.get('notifications'),
                target = evt.target,
                model;

            if (!target) {
                return;
            }
            if (target.get('tagName') !== 'LI') {
                target = target.ancestor('li');
            }

            model = notifications.getById(target.get('id'));
            model.set('seen', true);
            if (this.selection.hide) {
                target.hide(true);
            }
            this.slow_render();
        },

        /*
         * A flow of events can trigger many renders, from the event system
         * we debounce render requests with this method
         */
        slow_render: function () {
            var self = this;

            clearTimeout(this._renderTimeout);
            this._renderTimeout = setTimeout(function () {
                self.render();
            }, 200);
        },

        render: function () {
            var container = this.get('container'),
                env = this.get('env'),
                app = this.get('app'),
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

            var showable = this.get_showable(),
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
                open: open
            }));

            return this;
        },

        get_showable: function () {
            var notifications = this.get('notifications');
            return notifications.filter(function (n) {
                return n.get('level') == 'error' && n.get('seen') === false;
            }).map(function (n) {
                return n.getAttrs();
            });
        }

    }, {
        ATTRS: {
            display_size: {
                value: 8
            }
        }
    });
    views.NotificationsView = NotificationsView;


    var NotificationsOverview = Y.Base.create('NotificationsOverview', NotificationsView, [], {
        template: Templates.notifications_overview,
        events: {
            '.notice': {
                click: 'notice_select'
            }
        },
        // Actions for selecting a notice
        selection: {
            hide: false
        },

        /*
         *  The overview shows all events by default
         *  when real filtering is present this will have to take options
         */
        get_showable: function () {
            var notifications = this.get('notifications');
            return notifications.map(function (n) {
                return n.getAttrs();
            });
        }
    });

    views.NotificationsOverview = NotificationsOverview;

}, '0.1.0', {
    requires: [
        'view',
        'juju-view-utils',
        'node',
        'handlebars'
        ]
});
