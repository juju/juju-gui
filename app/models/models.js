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
models.ServiceUnit = ServiceUnit;

ServiceUnitList = Y.Base.create('serviceUnitList', Y.ModelList, [], {
    model: ServiceUnit,
    get_units_for_service: function(service) {
        var units = this.filter(function(m) { 
            console.log("filter", m.get("service"));
            console.log("service", service);
            return m.get("service").get("id") === service.get("id");
        });
        console.log("units_for_service", units);
        return units;
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