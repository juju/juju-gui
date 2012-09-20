'use strict';

YUI.add('juju-view-utils', function(Y) {

var views = Y.namespace('juju.views');

var JujuBaseView = Y.Base.create('JujuBaseView', Y.Base, [], {

    bindModelView: function(model) {
        model = model || this.get('model');
        // If this view has a model, bubble model events to the view.
        if (model) {
            model.addTarget(this);
        }

        // If the model gets swapped out, reset targets accordingly.
        this.after('modelChange', function (ev) {
            if (ev.prevVal) ev.prevVal.removeTarget(this);
            if (ev.newVal) ev.newVal.addTarget(this);
        });

        // Re-render this view when the model changes.
        this.after('*:change', this.render, this);
    },

    renderable_charm: function(charm_name, db) {
        var charm = db.charms.getById(charm_name);
        if (charm) {
            return charm.getAttrs();
        }
        return null;
    },

    stateToStyle: function(state, current) {
        // todo also check relations
        var classes;
        switch (state) {
        case 'pending':
            classes = 'state-pending';
                break;
        case 'started':
                classes = 'state-started';
                break;
        case 'start_error':
            classes = 'state-error';
                break;
        case 'install_error':
            classes = 'state-error';
                break;
        default:
            Y.log('Unhandled agent state: ' + state, 'debug');
        }
        classes = current && classes + ' ' + current || classes;
        return classes;
    },

    humanizeNumber: function(n) {
        var units = [ [1000, 'K'],
                      [1000000, 'M'],
                      [1000000000, 'B']],
            result = n;

        Y.each(units, function(sizer) {
                var threshold = sizer[0],
                    unit = sizer[1];
                   if(n > threshold) {
                    result = (n / threshold);
                    if (n % threshold !== 0) {
                        result = result.toFixed(1);
                    }
                    result = result + unit;
                }
        });
        return result;
    },

    addSVGClass: function(selector, class_name) {
        if (typeof(selector) == 'string') {
            Y.all(selector).each(function(n) {
                var classes = this.getAttribute('class');
                this.setAttribute('class', classes + ' ' + class_name);
            });
        } else {
            var classes = selector.getAttribute('class');
            selector.setAttribute('class', classes + ' ' + class_name);
        }
    },

    removeSVGClass: function(selector, class_name) {
        if (typeof(selector) == 'string') {
            Y.all(selector).each(function() {
                var classes = this.getAttribute('class');
                this.setAttribute('class', classes.replace(class_name, ''));
            });
        } else {
            var classes = selector.getAttribute('class');
            selector.setAttribute('class', classes.replace(class_name, ''));
        }
    }

});

views.JujuBaseView = JujuBaseView;

views.createModalPanel = function(body_content, render_target, action_label, action_cb) {
    var panel = new Y.Panel({
        bodyContent: body_content,
        width: 400,
        zIndex: 5,
        centered: true,
        show: false,
        classNames: 'modal',
        modal: true,
        render: render_target,
        buttons: [
            {
                value  : action_label,
                section: Y.WidgetStdMod.FOOTER,
                action : action_cb,
                classNames: ['btn-danger', 'btn']
            },
            {
                value  : 'Cancel',
                section: Y.WidgetStdMod.FOOTER,
                action : function (e) {
                    e.preventDefault();
                    panel.hide();
                },
                classNames: ['btn']
            }
        ]
    });
    // The default YUI CSS conflicts with the CSS effect we want.
    panel.get('boundingBox').all('.yui3-button').removeClass('yui3-button');
    return panel;
};

}, '0.1.0', {
    requires: ['base-build',
               'handlebars',
               'node',
               'view',
               'panel',
               'json-stringify']
});
