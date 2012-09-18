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
         * Behavior toggles
         * 
         * Flags indicating which behaviors we expect
         * to find in a given view. These toggle make subclassing 
         * simple. 
         * 
         * This pattern stems from trying to collect behaviors for the view in
         * one place but acts similar to declaritive controller logic.
         * 
         * :connection: Should the view be tied to websocket connection
         *             events.
         * 
         * :delta_stream: Should the view subscribe to delta stream events.
         * 
         *               
         */
        bindings: {
            connection: true,
            delta_stream: true,
            timestamps: true
        },

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
            if (this.bindings.connection) {
                env.on('connectedChange', this.slow_render, this);
            }

            if (this.bindings.delta_stream) {
                env.on('delta', this.generate_notices, this);
            }
        },

        /*
         * Parse the delta stream looking for interesting events to translate
         * into notifications. 
         *
         *  change_type maps to a set of controls
         *     model_list: (string)
         *         where do objects of this type live in the app.db

         * Each attribute of notify is checked in the appropriate rule
         * for a function that can return its value, if no rule is defined
         * the function in a rule called 'default' will be used. The signature
         * of all such methods will be::
         *     function(change_type, change_op, change_data) -> value
         */
        injest_rules: {
            service: {
                model_list: 'services'
            },
            relation: {
                model_list: 'relations'
            },
            unit: {
                model_list: 'units',
                level: function (change_type, change_op, change_data) {
                    var astate = change_data['agent-state'];
                    if (astate !== undefined && 
                        astate.search('error') > -1) {
                            return 'error';
                    }
                    return 'info';
                },
                evict: function (old, new_data, change) {
                    if (new_data.level != 'error') {
                        if (old.get('seen') === false) {
                            // mark it as seen 
                            old.set('seen', true);
                        }
                    }
                }
            },
                // Defaults when no special rules apply
            'default': {
                title: function (change_type, change_op, change_data) {
                    return change_op + ' ' + change_type;
                },
                message: function (change_type, change_op, change_data) {
                    return 'User actions suggested for ' + change_data.id;
                },
                level: function () {
                    return 'info';
                }
            }
        },
        /* 
         * Process new delta stream events and see if we need new notifications
         */
        generate_notices: function (delta_evt) {
            var self = this,
                rules = this.injest_rules,
                app = this.get('app'),
                notifications = this.get('notifications');

            function lookup_model(change_type, model_id) {
                var rule = rules[change_type],
                    obj_list,
                    model;
                console.group("lookup model");
                if (rule && rule.model_list) {
                    obj_list = app.db[rule.model_list];
                }
                else {
                    obj_list = app.db[change_type + 's'];
                }

                model = obj_list.getById(model_id);
                console.log("Found model for notice", model, delta_evt);
                console.groupEnd();
                return model;
            }

            delta_evt.data.result.forEach(function (change) {
                var change_type = change[0],
                    change_op = change[1],
                    change_data = change[2],
                    notify_data = {},
                    rule = rules[change_type],
                    model;

                /*
                 * Data injestion rules
                 *  Create notifications for incoming deltas
                 *  Promote some notifications to the 'show me' list
                 *  Also:
                 *  - for each change event see if there is an notice 
                 *   relating to that object in the model list
                 *    -- see if the current change event invalidates the need
                 *       to show the existing notices
                 *    -- make the new notice as 'must see' or not (
                 *       errors, etc)
                 *  - add a notification for the event
                 */

                // Dispatch injestion rules (which may mutate either the 
                // current 'notifications' or models within it (notice status)

                ['title', 'message', 'level'].forEach(function (attr) {
                    var active_rule = rule;
                    if (!active_rule) {
                        return;
                    }

                    if (!(attr in active_rule)) {
                        // No special rule exists, use the default
                        active_rule = rules['default'];
                    }

                    // Assign the attribute by the rule
                    if (attr in active_rule) {
                        notify_data[attr] = active_rule[attr](
                            change_type, change_op, change_data);
                    }
                });

                notify_data.kind = change_type;
                // see if there is an object associated with this
                // message
                console.groupCollapsed("Notification Model Handling");
                if (change_data.id) {
                    model = lookup_model(change_type, change_data.id);
                    if (model) {
                        notify_data.modelId = model;
                        notify_data.link = app.routeModel(model);
                        // If there are eviction rules for old notices 
                        // based on this model
                        var existing = notifications.getNotificationsForModel(
                            model);
                        if (existing && rule && rule.evict) {
                            existing.forEach(function (old) {
                                rule.evict(old, notify_data, change, 
                                notifications);
                            });
                        }
                    }
                }
                console.groupEnd();
                // If we have a title set we have enough info
                // to add _something_
                
                if (notify_data.title) {
                    notifications.create(notify_data);
                }
            });
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

            // Periodically update timestamps
            if (this.bindings.timestamps) {
                Y.later(6000, this, function (o) {
                    container.all('[data-timestamp]').each(function (n) {
                        n.setHTML(views.humanizeTimestamp(
                        n.getAttribute('data-timestamp')));
                    });
                }, [], true);
            }
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
        bindings: {
            connection: false,
            delta_stream: false,
            timestamps: true
        },
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
