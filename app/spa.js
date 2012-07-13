YUI().use('app', 'handlebars', 'jsonp', function(Y) {
    

   
Charm = Y.Base.create('charm', Y.Model, [], {
    ATTRS: {
	charm_id: {value: null},
	name: {value: null},
	url: {value: null},
	description: {value: null},
	config: {value: null},
	metadata: {value: null},
	sha256: {value: null}
    }
});


CharmList = Y.Base.create('charmList', Y.ModelList, [], {
    ATTRS: {
    }
});


Service = Y.Base.create('service', Y.Model, [], {
    ATTRS: {
	name: {value: null},
	charm: {value: null},
	config: {value: null},
	constraints: {value: null},
	exposed: {value: null},
    }
});


ServiceList = Y.Base.create('serviceList', Y.ModelList, [], {
    ATTRS: {
    }
});


ServiceUnit = Y.Base.create('serviceUnit', Y.ModelList, [], {
    ATTRS: {
	name: {value: null},
	service: {value: null},
	machine: {value: null},
	agent_state: {value: null},
	relations: {value: null},
	is_subordinate: {value: false},
	open_ports: {value: null},
	public_address: {value: null},
	private_address: {value: null},
    }
}


ServiceUnitList = Y.Base.create('serviceUnitList', Y.ModelList, [], {
    ATTRS: {
    }
}


Machine = Y.Base.create('machine', Y.Model, [], {
    ATTRS: {
	public_address: {value: null},
	private_address: {value: null}
    }
});

MachineList = Y.Base.create('machineList', Y.ModelList, [], {
    ATTRS: {
    }
});


      
Relation = Y.Base.create('relation', Y.Model, [], {
    ATTRS: {
    }
});

RelationList = Y.Base.create('relationList', Y.ModelList, [], {
    ATTRS: {
    }
});


})