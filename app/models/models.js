YUI().use('app', function(Y) {
    
var Charm, CharmList;
var Service, ServiceList;
var ServiceUnit, ServiceUnitList;
var Machine, MachineList;
var Relation, RelationList;

Charm = Y.Base.create('charm', Y.Model, [], {
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


CharmList = Y.Base.create('charmList', Y.ModelList, [], {
    model: Charm,
    ATTRS: {
    }
});


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


ServiceList = Y.Base.create('serviceList', Y.ModelList, [], {
    model: Service,
    ATTRS: {
    }
});


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


});
