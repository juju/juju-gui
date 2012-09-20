'use strict';

YUI.add('juju-models', function(Y) {

var models = Y.namespace('juju.models');

var Charm = Y.Base.create('charm', Y.Model, [], {
    idAttribute: 'charm_id',
    charm_id_re: /((\w+):)?(\w+)\/(\S+)-(\d+)/,
    parse_charm_id: function(id) {
        if (!id) { id = this.get('id'); }
        return this.charm_id_re.exec(id);
        }
    }, {
    ATTRS: {
        charm_id: {},
        name: {
            valueFn: function(name) {
                var match = this.parse_charm_id();
                if (match) {
                    return match[3] + '/' + match[4];
                }
            }
        },
        url: {},
        description: {},
        config: {},
        metadata: {},
        sha256: {}
    }
});
models.Charm = Charm;

var CharmList = Y.Base.create('charmList', Y.ModelList, [], {
    model: Charm
    }, {
    ATTRS: {
    }
});
models.CharmList = CharmList;



var Service = Y.Base.create('service', Y.Model, [], {
//    idAttribute: 'name',

    ATTRS: {
        name: {},
        charm: {},
        config: {},
        constraints: {},
        exposed: {value: false},
        relations: {},
        unit_count: {},
        aggregated_status: {}
    }
});
models.Service = Service;

var ServiceList = Y.Base.create('serviceList', Y.ModelList, [], {
    model: Service
    }, {
    ATTRS: {
    }
});
models.ServiceList = ServiceList;

var ServiceUnit = Y.Base.create('serviceUnit', Y.Model, [], {},
//    idAttribute: 'name',
    {
    ATTRS: {
        service: {
            valueFn: function(name) {
                var unit_name = this.get('id');
                return unit_name.split('/', 1)[0];
            }
        },
        number: {
            valueFn: function(name) {
                var unit_name = this.get('id');
                return parseInt(unit_name.split('/')[1], 10);
            }
        },
        machine: {},
        agent_state: {},
        // relations to unit relation state.
        relations: {},

        config: {},
        is_subordinate: {
            value: false // default
        },
        open_ports: {},
        public_address: {},
        private_address: {}
    }
});
models.ServiceUnit = ServiceUnit;

var ServiceUnitList = Y.Base.create('serviceUnitList', Y.LazyModelList, [], {
    model: ServiceUnit,
    get_units_for_service: function(service, asList) {
        var options = {},
            sid = service.get('id');

        if (asList !== undefined) {
            options.asList = true;
        }

        var units = this.filter(options, function(m) {
            return m.service == sid;
        });
        return units;
    },
    /*
     *  Return information about the state of all units focused on the
     * 'worst' status information available. In this way if any unit is in
     *  an error state we can report that for the whole list.
     *
     * KT - Should return an aggregate count by state (map), so proproptional
     * representation can be done in various renderings.
     */
    get_informative_state: function() {
    },
    /*
     *  Return information about the state of the set of units for a
     *  given service in the form of a map of agent states:
     *  state => number of units in that state
     */
    get_informative_states_for_service: function(service) {
        var aggregate_map = {}, aggregate_list = [],
            units_for_service = this.get_units_for_service(service);

        units_for_service.forEach(function(unit) {
            var state = unit.agent_state;
            if (aggregate_map[state] === undefined) {
                aggregate_map[state] = 1;
            } else {
                aggregate_map[state]++;
            }

        });

        return aggregate_map;
    },

    /*
     * Updates a service's unit count and aggregate state map during a
     * delta, ensuring that they're up to date.
     */
    update_service_unit_aggregates: function(service) {
        var aggregate = this.get_informative_states_for_service(service);
        var sum = 0;
        for (var agent_state in aggregate) {
            sum += aggregate[agent_state];
        }
        service.set('unit_count', sum);
        service.set('aggregated_status', aggregate);
    },
    ATTRS: {
    }
});
models.ServiceUnitList = ServiceUnitList;

var Machine = Y.Base.create('machine', Y.Model, [], {
    idAttribute: 'machine_id'
    }, {
    ATTRS: {
        machine_id: {},
        public_address: {},
        instance_id: {},
    instance_state: {},
    agent_state: {}
    }
});
models.Machine = Machine;

var MachineList = Y.Base.create('machineList', Y.ModelList, [], {
    model: Machine
    }, {
    ATTRS: {
    }
});
models.MachineList = MachineList;

var Relation = Y.Base.create('relation', Y.Model, [], {
    idAttribute: 'relation_id'
    }, {
    ATTRS: {
        relation_id: {},
        type: {},
        endpoints: {}
    }
});
models.Relation = Relation;

var RelationList = Y.Base.create('relationList', Y.ModelList, [], {}, {
    ATTRS: {
    }
});
models.RelationList = RelationList;


var Database = Y.Base.create('database', Y.Base, [], {
    initializer: function() {
        this.services = new ServiceList();
        this.machines = new MachineList();
        this.charms = new CharmList();
        this.relations = new RelationList();

        // This one is dangerous.. we very well may not have capacity
        // to store a 1-1 representation of units in js.
        // At least we should never assume the collection is complete, and
        // have usage of some ephemeral slice/cursor of the collection.
        // Indexed db might be interesting to explore here, with object delta
        // and bulk transfer feeding directly into indexedb.
        // Needs some experimentation with a large data set.
        this.units = new ServiceUnitList();

        // For model syncing by type. Charms aren't currently sync'd, only fetched
        // on demand (they are static).
        this.model_map = {
            'unit': ServiceUnit,
            'machine': Machine,
            'service': Service,
            'relation': Relation,
            'charm': Charm
        };
    },

    reset: function() {
        this.services.reset();
        this.machines.reset();
        this.charms.reset();
        this.relations.reset();
        this.units.reset();
    },

    on_delta: function(delta_evt) {
        var changes = delta_evt.data.result;
        console.log('Delta', this, changes);
        var change_type, model_class = null, self = this;

        changes.forEach(
            Y.bind(function(change) {
                change_type = change[0];
                model_class = this.model_map[change_type];

                if (!model_class) {
                    console.log('Unknown Change', change);
                }
                console.log('change', this, change);
                var model_list = this[change_type + 's'];
                this.process_model_delta(change, model_class, model_list);
            }, this));
        this.services.each(function(service) {
            self.units.update_service_unit_aggregates(service);
        });
        this.fire('update');
    },

    // utility method to sync a data object and a model object.
    _sync_bag: function(bag, model) {
        // TODO: need to bulk mutate and then send mutation event,
        // as is this is doing per attribute events.
        for (var vid in bag) {
            var value = bag[vid];
            var aid = vid.replace('-', '_');
            if (model.get(aid) != value) {
                model.set(aid, value);
            }
        }
    },

    process_model_delta: function(change, ModelClass, model_list) {
        // console.log('model change', change);
        var change_kind = change[1];
        var data = change[2];
        var o;
        if (change_kind == 'add' || change_kind == 'change') {
            // Client-side requests may create temporary objects in the
            // database in order to give the user more immediate feedback.
            // The temporary objects are created after the ACK message from
            // the server that contains their actual names.  When the delta
            // arrives for those objects, they already exist in a skeleton
            // form that needs to be fleshed out.  So, the existing objects
            // are kept and re-used.
            o = model_list.getById(data.id);
            if (Y.Lang.isNull(o)) {
                o = new ModelClass({id: data.id});
                this._sync_bag(data, o);
                model_list.add(o);
            } else {
                this._sync_bag(data, o);
            }
        } else if (change_kind == 'remove') {
            o = model_list.getById(data);
            // This should only be necessary while we are waiting on server
            // side changes to have deltas aware of client requests.
            if (!Y.Lang.isNull(o)) {
                model_list.remove(o);
            }
        } else {
            console.log('Unknown change kind in process_model_delta: ',
                        change_kind);
        }
    }

});

models.Database = Database;

Y.namespace('juju').db = new Database({});

}, '0.1.0', {
    requires: [
        'model',
        'model-list',
        'lazy-model-list'
    ]
});
