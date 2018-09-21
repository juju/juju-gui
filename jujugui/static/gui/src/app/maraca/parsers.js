/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

/**
  Parse an annotation.
  @param {Object} entity - The entity details.
    @param {Object} entity.annotations - The annotation details.
      @param {String} entity.annotations.bunde-url - The bundle url.
      @param {String} entity.annotations.gui-x - The x position for the gui.
      @param {String} entity.annotations.gui-y - The y position for the gui.
      @param {String} entity.model-uuid - The model uuid this entity belongs to.
    @param {String} entity.tag - The tag for this entity.
  @returns {Object} return The parsed entity.
    @returns {Object} return.annotations - The annotation details.
      @returns {String} return.annotations.bundeURL - The bundle url.
      @returns {String} return.annotations.guiX - The x position for the gui.
      @returns {String} return.annotations.guiY - The y position for the gui.
    @returns {String} return.modelUUID - The model uuid this entity belongs to.
    @returns {String} return.tag - The tag for this entity.
*/
function parseAnnotation(entity) {
  return {
    annotations: entity.annotations ? {
      bundleURL: entity.annotations['bundle-url'],
      guiX: entity.annotations['gui-x'],
      guiY: entity.annotations['gui-y']
    } : undefined,
    modelUUID: entity['model-uuid'],
    tag: entity.tag
  };
};

/**
  Parse a collection of annotations.
  @param {Object} response - The collection, containing annotations as described
    in parseAnnotation().
  @returns {Object} The parsed collection, containing annotations as described
    in parseAnnotation().
*/
function parseAnnotations(response) {
  let entities = {};
  Object.keys(response).forEach(key => {
    entities[key] = parseAnnotation(response[key]);
  });
  return entities;
};

/**
  Parse an application.
  @param {Object} entity - The entity details.
    @param {String} entity.charm-url - The charmstore URL for the entity.
    @param {Object} entity.config - The arbitrary config details.
      @param {String} entity.config."config-key" - The config value.
    @param {Object} entity.constraints - The arbitrary constraints details.
      @param {String} entity.constraints."constraint-key" - The constraint value.
    @param {Boolean} entity.exposed - Whether the entity is exposed.
    @param {String} entity.life - The lifecycle status of the entity.
    @param {Integer} entity.min-units - The minimum number of units for the entity.
    @param {String} entity.model-uuid - The model uuid this entity belongs to.
    @param {String} entity.name - The name of the entity.
    @param {String} entity.owner-tag - The tag for the owner.
    @param {Object} entity.status - The entity status.
      @param {String} entity.status.current - The current entity status.
      @param {String} entity.status.message - The status message.
      @param {String} entity.status.since - The datetime for when the status was set.
      @param {String} entity.status.version - The status version.
    @param {Boolean} entity.subordinate - Whether this is entity is a subordinate.
    @param {String} entity.workload-version - The version of the workload.
  @returns {Object} return - The parsed entity.
    @returns {String} return.charmURL - The charmstore URL for the entity.
    @returns {Object} return.config - The arbitrary config details.
      @returns {String} return.config."config-key" - The config value.
    @returns {Object} return.constraints - The arbitrary constraints details.
      @returns {String} return.constraints."constraint-key" - The constraint value.
    @returns {Boolean} return.exposed - Whether the entity is exposed.
    @returns {String} return.life - The lifecycle status of the entity.
    @returns {Integer} return.minUnits - The minimum number of units for the entity.
    @returns {String} return.modelUUID - The model uuid this entity belongs to.
    @returns {String} return.name - The name of the entity.
    @returns {String} return.ownerTag - The tag for the owner.
    @returns {Object} return.status - The entity status.
      @returns {String} return.status.current - The current entity status.
      @returns {String} return.status.message - The status message.
      @returns {String} return.status.since - The datetime for when the status was set.
      @returns {String} return.status.version - The status version.
    @returns {Boolean} return.subordinate - Whether this is entity is a subordinate.
    @returns {String} return.workloadVersion - The version of the workload.
*/
function parseApplication(entity) {
  return {
    charmURL: entity['charm-url'],
    // Config is arbitrary so leave the keys as defined.
    config: entity.config,
    // Constraints are arbitrary so leave the keys as defined.
    constraints: entity.constraints,
    exposed: entity.exposed,
    life: entity.life,
    minUnits: entity['min-units'],
    modelUUID: entity['model-uuid'],
    name: entity.name,
    ownerTag: entity['owner-tag'],
    status: entity.status ? {
      current: entity.status.current,
      message: entity.status.message,
      since: entity.status.since,
      version: entity.status.version
    } : undefined,
    subordinate: entity.subordinate,
    workloadVersion: entity['workload-version']
  };
};

/**
  Parse a collection of applications.
  @param {Object} response - The collection, containing applications as described
    in parseApplication().
  @returns {Object} The parsed collection, containing applications as described
    in parseApplication().
*/
function parseApplications(response) {
  let entities = {};
  Object.keys(response).forEach(key => {
    entities[key] = parseApplication(response[key]);
  });
  return entities;
};

/**
  Parse a machine.
  @param {Object} entity - The entity details.
    @param {Object[]} entity.addresses - The list of address objects.
    @param {String} entity.adresses[].value - The address.
    @param {String} entity.adresses[].type - The address type.
    @param {String} entity.adresses[].scope - The address scope.
    @param {Object} entity.agent-status - The agent status.
      @param {String} entity.agent-status.current - The current agent status.
      @param {String} entity.agent-status.message - The status message.
      @param {String} entity.agent-status.since - The datetime for when the status was set.
      @param {String} entity.agent-status.version - The status version.
    @param {Object} entity.hardware-characteristics - The arbitrary machine hardware details.
      @param {String} entity.hardware-characteristics."characteristic-key" - The
        characteristic value.
    @param {Boolean} entity.has-vote - Whether the entity has a vote.
    @param {String} entity.id - The entity id.
    @param {String} entity.instance-id - The instance id.
    @param {Object} entity.instance-status - The instance status.
      @param {String} entity.instance-status.current - The current instance status.
      @param {String} entity.instance-status.message - The status message.
      @param {String} entity.instance-status.since - The datetime for when the status was set.
      @param {String} entity.instance-status.version - The status version.
    @param {String} entity.jobs - The list of job strings.
    @param {String} entity.life - The lifecycle status of the entity.
    @param {String} entity.model-uuid - The model uuid this entity belongs to.
    @param {String} entity.series - The entity series.
    @param {String} entity.supported-containers - The list of supported container strings.
    @param {Boolean} entity.supported-containers-know - Whether the supported containers
      are known.
    @param {Boolean} entity.wants-vote - Whether the entity wants a vote.
  @returns {Object} return - The parsed entity.
    @returns {Object[]} return.addresses - The list of address objects.
    @returns {String} return.adresses[].value - The address.
    @returns {String} return.adresses[].type - The address type.
    @returns {String} return.adresses[].scope - The address scope.
    @returns {Object} return.agentStatus - The agent status.
      @returns {String} return.agentStatus.current - The current agent status.
      @returns {String} return.agentStatus.message - The status message.
      @returns {String} return.agentStatus.since - The datetime for when the status was set.
      @returns {String} return.agentStatus.version - The status version.
    @returns {Object} return.hardwareCharacteristics - The arbitrary machine hardware details.
      @returns {String} return.hardwareCharacteristics."characteristic-key" - The
        characteristic value.
    @returns {Boolean} return.hasVote - Whether the entity has a vote.
    @returns {String} return.id - The entity id.
    @returns {String} return.instanceId - The instance id.
    @returns {Object} return.instanceStatus - The instance status.
      @returns {String} return.instanceStatus.current - The current instance status.
      @returns {String} return.instanceStatus.message - The status message.
      @returns {String} return.instanceStatus.since - The datetime for when the status was set.
      @returns {String} return.instanceStatus.version - The status version.
    @returns {String} return.jobs - The list of job strings.
    @returns {String} return.life - The lifecycle status of the entity.
    @returns {String} return.modelUUID - The model uuid this entity belongs to.
    @returns {String} return.series - The entity series.
    @returns {String} return.supportedContainers - The list of supported container strings.
    @returns {Boolean} return.supportedContainersKnow - Whether the supported containers
      are known.
    @returns {Boolean} entity.wantsVote - Whether the entity wants a vote.
*/
function parseMachine(entity) {
  return {
    addresses: entity.addresses ? entity.addresses.map(address => ({
      value: address.value,
      type: address.type,
      scope: address.scope
    })) : undefined,
    agentStatus: entity['agent-status'] ? {
      current: entity['agent-status'].current,
      message: entity['agent-status'].message,
      since: entity['agent-status'].since,
      version: entity['agent-status'].version
    } : undefined,
    // Hardware characteristics are arbitrary so leave the keys as defined.
    hardwareCharacteristics: entity['hardware-characteristics'],
    hasVote: entity['has-vote'],
    id: entity.id,
    instanceID: entity['instance-id'],
    instanceStatus: entity['instance-status'] ? {
      current: entity['instance-status'].current,
      message: entity['instance-status'].message,
      since: entity['instance-status'].since,
      version: entity['instance-status'].version
    } : undefined,
    jobs: entity.jobs,
    life: entity.life,
    modelUUID: entity['model-uuid'],
    series: entity.series,
    supportedContainers: entity['supported-containers'],
    supportedContainersKnown: entity['supported-containers-known'],
    wantsVote: entity['wants-vote']
  };
};

/**
  Parse a collection of machines.
  @param {Object} response - The collection, containing machines as described
    in parseMachine().
  @returns {Object} The parsed collection, containing machines as described
    in parseMachine().
*/
function parseMachines(response) {
  let entities = {};
  Object.keys(response).forEach(key => {
    entities[key] = parseMachine(response[key]);
  });
  return entities;
};

/**
  Parse a relation.
  @param {Object} entity - The entity details.
    @param {Object[]} entity.endpoints - The list of endpoint objects.
      @param {String} entity.endpoints[].application-name - The application name.
      @param {Object} entity.endpoints[].relation - The relation details.
        @param {String} entity.endpoints[].relation.name - The relation name.
        @param {String} entity.endpoints[].relation.role - The relation role.
        @param {String} entity.endpoints[].relation.interface - The relation interface.
        @param {Boolean} entity.endpoints[].relation.option - Whether the relation is optional.
        @param {Integer} entity.endpoints[].relation.limit - The relation limit.
        @param {String} entity.endpoints[].relation.scope - The relation scope.
    @param {String} entity.id - The entity id.
    @param {String} entity.string - The entity string.
    @param {String} entity.model-uuid - The model uuid this entity belongs to.
  @returns {Object} return - The parsed entity.
    @returns {Object[]} return.endpoints - The list of endpoint objects.
      @returns {String} return.endpoints[].applicationName - The application name.
      @returns {Object} return.endpoints[].relation - The relation details.
        @returns {String} return.endpoints[].relation.name - The relation name.
        @returns {String} return.endpoints[].relation.role - The relation role.
        @returns {String} return.endpoints[].relation.interface - The relation interface.
        @returns {Boolean} return.endpoints[].relation.option - Whether the relation
          is optional.
        @returns {Integer} return.endpoints[].relation.limit - The relation limit.
        @returns {String} return.endpoints[].relation.scope - The relation scope.
    @returns {String} return.id - The entity id.
    @returns {String} return.string - The entity string.
    @returns {String} return.modelUUID - The model uuid this entity belongs to.
*/
function parseRelation(entity) {
  return {
    endpoints: entity.endpoints ? entity.endpoints.map(endpoint => ({
      applicationName: endpoint['application-name'],
      relation: {
        name: endpoint.relation.name,
        role: endpoint.relation.role,
        'interface': endpoint.relation.interface,
        optional: endpoint.relation.optional,
        limit: endpoint.relation.limit,
        scope: endpoint.relation.scope
      }
    })) : undefined,
    id: entity.id,
    key: entity.key,
    modelUUID: entity['model-uuid']
  };
};

/**
  Parse a collection of relations.
  @param {Object} response - The collection, containing relations as described
    in parseRelation().
  @returns {Object} The parsed collection, containing relations as described
    in parseRelation().
*/
function parseRelations(response) {
  let entities = {};
  Object.keys(response).forEach(key => {
    entities[key] = parseRelation(response[key]);
  });
  return entities;
};

/**
  Parse a remote application.
  @param {Object} entity - The entity details.
    @param {String} entity.life - The lifecycle status of the entity.
    @param {String} entity.model-uuid - The model uuid this entity belongs to.
    @param {String} entity.name - The entity name.
    @param {String} entity.offer-url - The offer URL.
    @param {String} entity.offer-uuid - The offer UUID.
    @param {Object} entity.status - The status.
      @param {String} entity.status.current - The current status.
      @param {String} entity.status.message - The status message.
      @param {String} entity.status.since - The datetime for when the status was set.
      @param {String} entity.status.version - The status version.
  @returns {Object} return - The parsed entity.
    @returns {String} return.life - The lifecycle status of the entity.
    @returns {String} return.modelUUID - The model uuid this entity belongs to.
    @returns {String} return.name - The entity name.
    @returns {String} return.offerURL - The offer URL.
    @returns {String} return.offerUUID - The offer UUID.
    @returns {Object} return.status - The status.
      @returns {String} return.status.current - The current status.
      @returns {String} return.status.message - The status message.
      @returns {String} return.status.since - The datetime for when the status was set.
      @returns {String} return.status.version - The status version.
*/
function parseRemoteApplication(entity) {
  return {
    life: entity.life,
    modelUUID: entity['model-uuid'],
    name: entity.name,
    offerURL: entity['offer-url'],
    offerUUID: entity['offer-uuid'],
    status: entity.status ? {
      current: entity.status.current,
      message: entity.status.message,
      since: entity.status.since,
      version: entity.status.version
    } : undefined
  };
};

/**
  Parse a collection of remote applications.
  @param {Object} response - The collection, containing remote applications as
    described in parseRemoteApplication().
  @returns {Object} The parsed collection, containing remote applications as
    described in parseRemoteApplication().
*/
function parseRemoteApplications(response) {
  let entities = {};
  Object.keys(response).forEach(key => {
    entities[key] = parseRemoteApplication(response[key]);
  });
  return entities;
};

/**
  Parse a unit.
  @param entity {Object} The entity details.
    @param {Object} entity.agent-status - The agent status.
      @param {String} entity.agent-status.current - The current status.
      @param {String} entity.agent-status.message - The status message.
      @param {String} entity.agent-status.since - The datetime for when the status was set.
      @param {String} entity.agent-status.version - The status version.
    @param {String} entity.application - The application this entity belongs to.
    @param {String} entity.charm-url - The charm URL for this unit.
    @param {String} entity.machine-id - The id of the machine this unit is on.
    @param {String} entity.model-uuid - The model uuid this entity belongs to.
    @param {String} entity.name - The name of the unit.
    @param {Object[]} entity.port-ranges[] - The collection of port range objects.
      @param {Integer} entity.port-ranges[].from-port - The start of the port range.
      @param {Integer} entity.port-ranges[].to-port - The end of the port range.
      @param {String} entity.port-ranges[].protocol - The port protocol.
    @param {Object[]} entity.ports - The collection of port objects.
      @param {String} entity.ports[].protocol - The port protocol.
      @param {Integer} entity.ports[].number - The port number.
    @param {String} entity.private-address - The unit's private address.
    @param {String} entity.public-address - The unit's public address.
    @param {String} entity.series - The series of the unit.
    @param {Boolean} entity.subordinate - Whether the unit is a subordinate.
    @param {Object} entity.workload-status - The workload status.
      @param {String} entity.workload-status.current - The current status.
      @param {String} entity.workload-status.message - The status message.
      @param {String} entity.workload-status.since - The datetime for when the status was set.
      @param {String} entity.workload-status.version - The status version.
  @returns {Object} return The parsed entity.
    @returns {Object} return.agentStatus - The agent status.
      @returns {String} return.agentStatus.current - The current status.
      @returns {String} return.agentStatus.message - The status message.
      @returns {String} return.agentStatus.since - The datetime for when the status was set.
      @returns {String} return.agentStatus.version - The status version.
    @returns {String} return.application - The application this entity belongs to.
    @returns {String} return.charmURL - The charm URL for this unit.
    @returns {String} return.machineID - The id of the machine this unit is on.
    @returns {String} return.modelUUID - The model uuid this entity belongs to.
    @returns {String} return.name - The name of the unit.
    @returns {Object[]} return.portRanges - The collection of port range objects.
      @returns {Integer} return.portRanges[].fromPort - The start of the port range.
      @returns {Integer} return.portRanges[].toPort - The end of the port range.
      @returns {String} return.portRanges[].protocol - The port protocol.
    @returns {Object[]} return.ports - The collection of port objects.
      @returns {String} return.ports[].protocol - The port protocol.
      @returns {Integer} return.ports[].number - The port number.
    @returns {String} return.privateAddress - The unit's private address.
    @returns {String} return.publicAddress - The unit's public address.
    @returns {String} return.series - The series of the unit.
    @returns {Boolean} return.subordinate - Whether the unit is a subordinate.
    @returns {Object} return.workloadStatus - The workload status.
      @returns {String} return.workloadStatus.current - The current status.
      @returns {String} return.workloadStatus.message - The status message.
      @returns {String} return.workloadStatus.since - The datetime for when the status was set.
      @returns {String} return.workloadStatus.version - The status version.
*/
function parseUnit(entity) {
  return {
    agentStatus: entity['agent-status'] ? {
      current: entity['agent-status'].current,
      message: entity['agent-status'].message,
      since: entity['agent-status'].since,
      version: entity['agent-status'].version
    } : undefined,
    application: entity.application,
    charmURL: entity['charm-url'],
    machineID: entity['machine-id'],
    modelUUID: entity['model-uuid'],
    name: entity.name,
    portRanges: entity['port-ranges'] ? entity['port-ranges'].map(range => ({
      fromPort: range['from-port'],
      toPort: range['to-port'],
      protocol: range.protocol
    })) : undefined,
    ports: entity.ports ? entity.ports.map(port => ({
      protocol: port.protocol,
      number: port.number
    })) : undefined,
    privateAddress: entity['private-address'],
    publicAddress: entity['public-address'],
    series: entity.series,
    subordinate: entity.subordinate,
    workloadStatus: entity['workload-status'] ? {
      current: entity['workload-status'].current,
      message: entity['workload-status'].message,
      since: entity['workload-status'].since,
      version: entity['workload-status'].version
    } : undefined
  };
};

/**
  Parse a collection of units.
  @param {Object} response - The collection, containing units as described
    in parseUnit().
  @returns {Object} The parsed collection, containing units as described
    in parseUnit().
*/
function parseUnits(response) {
  let entities = {};
  Object.keys(response).forEach(key => {
    entities[key] = parseUnit(response[key]);
  });
  return entities;
};

/**
  Parse a full megawatcher object.
  @param {Object} response - The collections of entites.
    @param {Object} response.annotations - The collection of annotations.
    @param {Object} response.applications - The collection of applications.
    @param {Object} response.machines - The collection of machines.
    @param {Object} response.relations - The collection of relations.
    @param {Object} response.remote-applications - The collection of remote-applications.
  @returns {Object} return - The parsed collections.
    @returns {Object} return.annotations - The collection of annotations.
    @returns {Object} return.applications - The collection of applications.
    @returns {Object} return.machines - The collection of machines.
    @returns {Object} return.relations - The collection of relations.
    @returns {Object} return.remoteApplications - The collection of remote-applications.
*/
function parseMegaWatcher(response) {
  return {
    annotations: parseAnnotations(response.annotations),
    applications: parseApplications(response.applications),
    machines: parseMachines(response.machines),
    relations: parseRelations(response.relations),
    remoteApplications: parseRemoteApplications(response['remote-applications']),
    units: parseUnits(response.units)
  };
};

module.exports = {
  parseAnnotation,
  parseAnnotations,
  parseApplication,
  parseApplications,
  parseMachine,
  parseMachines,
  parseMegaWatcher,
  parseRelation,
  parseRelations,
  parseRemoteApplication,
  parseRemoteApplications,
  parseUnit,
  parseUnits
};
