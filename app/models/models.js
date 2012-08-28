YUI.add("juju-models", function(Y) {

var models = Y.namespace("juju.models");

var Charm = Y.Base.create('charm', Y.Model, [], {
    idAttribute: 'charm_id'
    }, {
    ATTRS: {
	charm_id: {},
	name: {},
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



Service = Y.Base.create('service', Y.Model, [], {
//    idAttribute: 'name',

    get_unit_agent_states: function() {
        // return an object with keys set to each unique agent state
        // in this services units
        // XXX: for this to work we need access to the units
        // of this service, this either creates a dep on the
        // apps data store or requires explicit binding at
        // creation
    },
    ATTRS: {
	name: {},
	charm: {},
	config: {},
	constraints: {},
	exposed: {value: false},
	relations: {}
    }
});
models.Service = Service;

ServiceList = Y.Base.create('serviceList', Y.ModelList, [], {
    model: Service
    }, {
    ATTRS: {
    }
});
models.ServiceList = ServiceList;

ServiceUnit = Y.Base.create('serviceUnit', Y.Model, [], {},
//    idAttribute: 'name',
    {
    ATTRS: {
	service: {
            valueFn: function(name) {
                var unit_name = this.get("id");
                return unit_name.split("/", 1)[0];
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

ServiceUnitList = Y.Base.create('serviceUnitList', Y.ModelList, [], {
    model: ServiceUnit,
    get_units_for_service: function(service, asList) {
        var options = {},
            sid = service.get("id");

        if (asList !== undefined) {
            options.asList = true;
        }
        
        var units = this.filter(options, function(m) {
            return m.get("service") == sid;
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
    ATTRS: {
    }
});
models.ServiceUnitList = ServiceUnitList;

Machine = Y.Base.create('machine', Y.Model, [], {
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

MachineList = Y.Base.create('machineList', Y.ModelList, [], {
    model: Machine
    }, {
    ATTRS: {
    }
});
models.MachineList = MachineList;

Relation = Y.Base.create('relation', Y.Model, [], {
    idAttribute: 'relation_id'
    }, {
    ATTRS: {
	relation_id: {},
	type: {},
	endpoints: {}
    }
});
models.Relation = Relation;

RelationList = Y.Base.create('relationList', Y.ModelList, [], {}, {
    ATTRS: {
    }
});
models.RelationList = RelationList;

    
Database = Y.Base.create('database', Y.Base, [], {
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
        // on demand (their static).
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
        console.log("Delta", this, changes);
        var change_type, model_class = null;

        changes.forEach(
            Y.bind(function(change) {
                change_type = change[0];
                model_class = this.model_map[change_type];

                if (!model_class) {
                    console.log("Unknown Change", change);
                }
                console.log('change', this, change);
                var model_list = this[change_type + 's'];
                this.process_model_delta(change, model_class, model_list);
            }, this));
        this.fire('update');
    },

    // utility method to sync a data object and a model object.
    _sync_bag: function(bag, model) {
        // TODO: need to bulk mutate and then send mutation event,
        // as is this is doing per attribute events.
        for (var vid in bag) {
            value = bag[vid];
            aid = vid.replace('-', "_");
            if (model.get(aid) != value) {
                model.set(aid, value);
            }
        }
    },

    process_model_delta: function(change, model_class, model_list) {
        // console.log('model change', change);
        var change_kind = change[1];
        var data = change[2];
        if (change_kind == 'add') {
            o = new model_class({id: data['id']});
            this._sync_bag(data, o);
            model_list.add(o);
        } else if (change_kind == 'delete') {
            model_list.remove(model_list.getById(data));
        } else if (change_kind == 'change') {
            o = model_list.getById(data['id']);
            this._sync_bag(data, o);
        }
    }
 
});

models.Database = Database;

Y.namespace("juju").db = new Database({});

}, "0.1.0", {
    requires: [
        "model",
        "model-list",
        "model-list-lazy"
    ]
});