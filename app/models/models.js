YUI.add("juju-models", function(Y) {

var juju = Y.namespace("juju");
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
        var options = {};
        if (asList !== undefined) {
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
	this.units = new ServiceUnitList();
    },

    reset: function() {
        this.services.reset();
        this.machines.reset();
        this.charms.reset();
        this.relations.reset();
        this.units.reset();
    },

    parse_status: function(status_json) {
        // for now we reset the lists rather than sync/update
        this.services.reset();
        this.machines.reset();
        this.charms.reset();
        this.relations.reset();
        this.units.reset();

        Y.each(status_json.machines,
            function(machine_data, machine_name) {
                var machine = new models.Machine({
                    machine_id: machine_name,
                    public_address: machine_data["dns-name"]});
                d.machines.add(machine);
            }, this);
	
        
        Y.each(status_json.services,
            function(service_data, service_name) {
		       // XXX: only for charm store charms.
                var charm_name = service_data.charm.split(":")[1].split("-")[0];
                var charm = new models.Charm({
                    charm_id: service_data.charm,
                    charm_name: charm_name});
                var service = new models.Service({
                    name: service_name,
                    charm: service_data.charm});
                d.services.add(service);
                d.charms.add(charm);
                
                Y.each(service_data.units, function(unit_data, unit_name) {
                    var unit = new models.ServiceUnit({
                            name: unit_name,
                            service: service,
                            machine: d.machines.getById(unit_data.machine),
                            agent_state: unit_data["agent-state"],
                            is_subordinate: (service_data.subordinate || false),
                            public_address: unit_data["public-address"]
                            });
                    d.units.add(unit);
                }, this);

                Y.each(service_data.relations,
                    function(relation_data, relation_name) {
                        // XXX: only preocessing 1st element for now
                        relations[service_name] = relation_data[0];
                        // XXX: fixiing this will alter the build
                        // in the relations block below
                }, this);

            }, this);

        Y.each(relations, function(source, target) {
                   var s = d.services.getById(source);
                   var t = d.services.getById(target);
                   var relation = new models.Relation({
                           endpoints: {source: s, target: t}
                           });
                   d.relations.add(relation);
               });

    }
});

juju.db = new Database({});

Y.namespace("juju").db = new Database({});

}, "0.1.0", {
    requires: [
        "model",
        "model-list"
    ]
});