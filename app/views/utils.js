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
    }

});

views.JujuBaseView = JujuBaseView;


function BoundingBox() {
    BoundingBox.superclass.constructor.apply(this, arguments);
};

BoundingBox.NAME = "BoundingBox";

BoundingBox.ATTRS =  {
    model: {
        setter: function(model) {
            this._model = [model.name, model.get('id')];
            Y.aggregate(this, model.getAttrs());
        },
        getter: function(){ return this._model;}
    },
    modelId: {
        getter: function() {
            var model = this.get('model');
            return model[0] + '-' + model[1];
        }
    },

    x: {value:0,
        setter: function(value) {
            this.x0 = this.x;
            console.log("setting x from", this.x0, value);
            return value;
        }
       },
    y: {
        value:0,
        setter: function(value) {
            this.y0 = this.y;
            return value;
        }
    },
    w: {value:0},
    h: {value:0},
    value: {value:0}


};

views.BoundingBox = Y.extend(BoundingBox, Y.Base, {
    initializer: function(model) {
        var self = this;
    },

    getXY: function() {
        return [this.x, this.y];
    },

    setXY: function(x, y) {
        this.x = x; this.y = y;
        return this;
    },
        
    getWH: function() {
        return [this.w, this.h];
    },
        
    setWH: function(w, h) {
        this.w = w; this.h = h;
        return this;
    },
      
    
    /*
     * Return the 50% points along each side as xy pairs
     */
    getConnectors: function() {
        return {
            top: [this.x + (this.w / 2), this.y],
            right: [this.x + this.w, this.y + (this.h / 2)],
            bottom: [this.x + (this.w / 2), this.y + this.h],
            left: [this.x, this.y + (this.h / 2)]
        };
    },

    _distance: function(xy1, xy2) {
        return Math.sqrt(Math.pow(xy1[0] - xy2[0], 2) + 
                         Math.pow(xy1[1] - xy2[1], 2));
    },
        
    /* 
     * Connectors are defined on four borders, find the one closes to
     * another BoundingBox
     */
    getNearestConnector: function(other_box) {
        var self = this, 
            connectors = this.getConnectors(),
            result = null, shortest_d = Infinity,
            source = other_box;
        if ("getXY" in other_box) {
            source = other_box.getXY();            
        }

        Y.each(connectors, function(ep) {
            // Take the distance of each XY pair
            var d = self._distance(source, ep);
            if (!result || d < shortest_d) {
                shortest_d = d;
                result = ep;
            }
        });
        return result;
    },
                          
    /*
     * Return [this.connector.XY, other.connector.XY] (in that order) 
     * that as nearest to each other. This can be used to define start-end
     * points for routing.
     */
    getConnectorPair: function(other_box) {
        var self = this, 
            sc = this.getConnectors(),
            oc = other_box.getConnectors(),
            result = null, shortest_d = Infinity;

        Y.each(sc, function(ep1) {
            Y.each(oc, function(ep2) {
                // Take the distance of each XY pair
                var d = self._distance(ep1, ep2);
                if (!result || d < shortest_d) {
                    shortest_d = d;
                    result = [ep1, ep2];
                }
            });
        });
        return result;

    },

    translateStr: function() {
        return 'translate(' + this.getXY() + ')';
    }
                                 
});

views.toBoundingBox = function(model) {
    var box = new BoundingBox();
    box.set('model', model);
    return box;
};

}, '0.1.0', {
    requires: ['base-build',
               'handlebars',
               'node',
               'view',
               'json-stringify']
});
