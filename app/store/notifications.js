'use strict';

YUI.add('juju-notification-controller', function(Y) {

  var juju = Y.namespace('juju');

  /*
     * NotificationController
     *
     * This controller manages the relationship between incoming delta stream
     * events and the notification models the views use for display and
     * interaction.  NotificationController({env: Environment,
     * notifications: ModelList})
     */

  var NotificationController = Y.Base.create('NotificationController',
      Y.Base, [], {

        /**
         This tells `Y.Base` that it should create ad-hoc attributes for config
         properties.

         @property _allowAdHocAttrs
         @type {Boolean}
         @default true
         @protected
         @since 3.5.0
         **/
        _allowAdHocAttrs: true,

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
        ingest_rules: {
          service: {
            model_list: 'services'
          },
          relation: {
            model_list: 'relations'
          },
          unit: {
            model_list: 'units',
            level: function(change_type, change_op, change_data) {
              var astate = change_data['agent-state'];
              if (astate !== undefined &&
                  astate.search('error') > -1) {
                return 'error';
              }
              return 'info';
            },
            evict: function(old, new_data, change) {
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
            title: function(change_type, change_op, change_data) {
              return change_op + ' ' + change_type;
            },
            message: function(change_type, change_op, change_data) {
              return 'User actions suggested for ' + change_data.id;
            },
            level: function() {
              return 'info';
            }
          }
        },
        /*
         * Process new delta stream events and see if we need new notifications
         */
        generate_notices: function(delta_evt) {
          console.log('Generating Notices', this, this.getAttrs());
          var self = this,
              rules = this.ingest_rules,
              app = this.get('app'),
              notifications = this.get('notifications');

          delta_evt.data.result.forEach(function(change) {
            var change_type = change[0],
                    change_op = change[1],
                    change_data = change[2],
                    notify_data = {},
                    rule = rules[change_type],
                    model;

            /*
                 * Data ingestion rules
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

            // Dispatch ingestion rules (which may mutate either the
            // current 'notifications' or models within it (notice status)

            ['title', 'message', 'level'].forEach(function(attr) {
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
            //console.groupCollapsed('Notification Model Handling');
            //console.log('resolve model from change', app, change);
            model = app.db.getModelFromChange(change);
            if (model) {
              // modelId setter pulls the modelId reference from a
              // motel automatically
              notify_data.modelId = model;
              notify_data.link = app.getModelURL(model);
              // If there are eviction rules for old notices
              // based on this model
              var existing = notifications.getNotificationsForModel(
                  model);
              if (existing && rule && rule.evict) {
                existing.forEach(function(old) {
                  rule.evict(old, notify_data, change,
                      notifications);
                });
              }
            }
            //console.groupEnd();
            // If we have a title set we have enough info
            // to add _something_

            if (notify_data.title) {
              notifications.create(notify_data);
            }
          });
        }
      });

  juju.NotificationController = NotificationController;

}, '0.1.0', {
  requires: ['juju-models']
});

