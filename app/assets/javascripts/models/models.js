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
    ATTRS: {
	name: {},
	charm: {},
	config: {},
	constraints: {},
	exposed: {},
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

ServiceUnit = Y.Base.create('serviceUnit', Y.ModelList, [], {
    idAttribute: 'name',
    ATTRS: {
	name: {},
	service: {},
	machine: {},
	agent_state: {},
	// relations to unit relation state.
	relations: {},
	is_subordinate: {},
	open_ports: {},
	public_address: {},
	private_address: {}
    }
});


ServiceUnitList = Y.Base.create('serviceUnitList', Y.ModelList, [], {
    model: ServiceUnit,
    ATTRS: {
    }
});


Machine = Y.Base.create('machine', Y.Model, [], {
    idAttribute: 'machine_id',
    ATTRS: {
	machine_id: {},
	public_address: {},
	private_address: {}
    }
});

MachineList = Y.Base.create('machineList', Y.ModelList, [], {
    model: Machine,
    ATTRS: {
    }
});



Relation = Y.Base.create('relation', Y.Model, [], {
    idAttribute: 'relation_id',
    ATTRS: {
	relation_id: {},
	type: {},
	endpoints: {}
    }
});

RelationList = Y.Base.create('relationList', Y.ModelList, [], {
    ATTRS: {
    }
});


}, "0.1.0", {
    requires: [
        "model", 
        "model-list"
    ]
});