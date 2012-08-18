YUI.add("juju-models", function(Y) {

var models = Y.namespace("juju.models");

var Charm = Y.Base.create('charm', Y.Model, [], {
    idAttribute: 'charm_id',
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
    model: Charm,
    ATTRS: {
    }
});
models.CharmList = CharmList;

Service = Y.Base.create('service', Y.Model, [], {
    idAttribute: 'name',

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
    model: Service,
    ATTRS: {
    }
});
models.ServiceList = ServiceList;

ServiceUnit = Y.Base.create('serviceUnit', Y.Model, [], {
    idAttribute: 'name',

    ATTRS: {
	name: {},
	service: {},
	machine: {},
	agent_state: {},
	// relations to unit relation state.
	relations: {},
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
        var options = {};
        if (asList != undefined) {
            options.asList = true;
        }
        var units = this.filter(options, function(m) { 
            return m.get("service").get("id") === service.get("id");
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
    idAttribute: 'machine_id',
    ATTRS: {
	machine_id: {},
	public_address: {},
	private_address: {}
    }
});
models.Machine = Machine;

MachineList = Y.Base.create('machineList', Y.ModelList, [], {
    model: Machine,
    ATTRS: {
    }
});

models.MachineList = MachineList;




Relation = Y.Base.create('relation', Y.Model, [], {
    idAttribute: 'relation_id',
    ATTRS: {
	relation_id: {},
	type: {},
	endpoints: {}
    }
});
models.Relation = Relation;


RelationList = Y.Base.create('relationList', Y.ModelList, [], {
    ATTRS: {
    }
});
models.RelationList = RelationList;


}, "0.1.0", {
    requires: [
        "model", 
        "model-list"
    ]
});