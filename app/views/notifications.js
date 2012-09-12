'use strict';

YUI.add('juju-notifications', function(Y) {


var views = Y.namespace('juju.views'),
    Templates = views.Templates;

/*
 * View a ModelList  of notifications
 */
var NotificationsView = Y.Base.create('NotificationsView', Y.View,
    [views.JujuBaseView], {
    template: Templates.notifications,
    events: {
        '#notify-indicator': {click: 'notify_toggle'},
        '.notice': {click: 'notice_select'}
    },

    initializer: function() {
        NotificationsView.superclass.constructor.apply(this, arguments);
      
        var ml = this.get('model_list'),          
            env = this.get('env');

        // Bind view to model list in a number of ways
        ml.addTarget(this);
        // Re-render the model list changes
        ml.after('add', this.slow_render, this);
        ml.after('create', this.slow_render, this);
        ml.after('remove', this.slow_render, this);
        ml.after('reset', this.slow_render, this);

        // Env connection state watcher
        env.on('connectedChange', this.slow_render, this);
        env.on('delta', this.generate_notices, this);
    },
      
    /*
     * Parse the delta stream looking for interesting events to translate
     * into notices. This could get filtered through a per user/env ruleset.
     */
    notice_rules: {
        service: {add: 'change_to_notice',
                 'delete': 'change_to_notice'}
    },
      
    /* 
     * Process new delta stream events and see if we need new notifications
     */
    generate_notices: function(delta_evt) {
        var self = this,
            rules = this.notice_rules;
        
        delta_evt.data.result.forEach(function(change) {
            var change_type = change[0],
                change_op = change[1],
                change_data = change[2];
            // see if there is a rule for this type of operation
            if (rules[change_type] && rules[change_type][change_op]) {
                var op = rules[change_type][change_op];
                self[op](change_type, change_op, change_data);
            }
        });
    },
            
    /*
     * Convert a single change event to a new notice
     */
    change_to_notice: function(kind, op, data){
        var ml = this.get('model_list');
        ml.create({
                title: op + ' ' + kind, 
                message: data.id + ' was added.'
        });
        
    },


    /*
     * Event handler for clicking the notification icon.
     */
    notify_toggle: function(evt) {
        var container = this.get('container'),
            ml = this.get('model_list'),
            target = evt.target.getAttribute('data-target'),
            el = container.one('#' + target),
            parent = el.ancestor();
        
        if (ml.size() === 0) {return;}

        if (parent.hasClass('open')) {
            el.hide(true);
        } else {
            el.show(true);
        }
        parent.toggleClass('open');
        el.toggleClass('active');

    },

    /*
     * Select/click on a notice. Currently this just removes it from the
     * model_list
     */
    notice_select: function(evt) {
        var ml = this.get('model_list'), 
            target = evt.target,
            model;

        if (target.get('tagName') !== 'LI') {
            target = target.ancestor('li');
        }
        
        model = ml.getByClientId(target.get('id'));
        target.hide(true);
        ml.remove(model);
    },

    /*
     * A flow of events can trigger many renders, from the event system
     * we debounce render requests with this method
     */
    slow_render: function() {
        var self = this;

        clearTimeout(this._renderTimeout);
        this._renderTimeout = setTimeout(function () {
            self.render();
        }, 200);
    },

    render: function () {
        var container = this.get('container'),
            env = this.get('env'),
            connected = env.get('connected'),
            ml = this.get('model_list'),
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
        if (ml.size() === 0) {
            open = '';
        }

        /* 
         * Todo: scan the list to see if there are messages in an 
         * error state (level=='error') and use 
         */
        if (!connected) {
            state = 'btn-warning';
        } else if (ml.size() > 0) {
            var levels = ml.get_notice_levels();
            if (levels.error) {
                state = 'btn-danger';
            } else if (ml.get_unseen_count() > 0) {
                state = 'btn-info';                
            }
        } 

        container.setHTML(this.template(
            {notifications: ml.map(function(n) {return n.getAttrs();}),
             count: ml.size(),
             state: state,
             open: open
             }));

        // Periodically update timestamps
        Y.later(6000, this, function(o) {
            container.all('.timestamp').each(function(n){
            n.setHTML(views.humanizeTimestamp(
                    n.getAttribute('data-timestamp')));
            });
        }, [], true);
        return this;
    }

});
views.NotificationsView = NotificationsView;

}, '0.1.0', {
    requires: [
        'view',
        'juju-view-utils',
        'event-hover',
        'node',
        'handlebars'
        ]
});
