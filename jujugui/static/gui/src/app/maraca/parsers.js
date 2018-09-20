/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const parsers = {};

/**
  Parse an annotation.
  @param entity {Object} The entity details, containing:
  - @param annotations {Object} The annotation details, containing:
  - - @param bunde-url {String} The bundle url.
  - - @param gui-x {String} The x position for the gui.
  - - @param gui-y {String} The y position for the gui.
  - @param model-uuid {String} The model uuid this entity belongs to.
  - @param tag {String} The tag for this entity.
  @returns {Object} The parsed entity, containing:
  - @param annotations {Object} The annotation details, containing:
  - - @param bundleURL {String} The bundle url.
  - - @param guiX {String} The x position for the gui.
  - - @param guiY {String} The y position for the gui.
  - @param modelUUID {String} The model uuid this entity belongs to.
  - @param tag {String} The tag for this entity.
*/
parsers.parseAnnotation = entity => {
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
  @param response {Object} The collection, containing annotations as described
    in parseAnnotation().
  @returns {Object} The parsed collection, containing annotations as described
    in parseAnnotation().
*/
parsers.parseAnnotations = response => {
  let entities = {};
  Object.keys(response).forEach(key => {
    entities[key] = parsers.parseAnnotation(response[key]);
  });
  return entities;
};

/**
  Parse an application.
  @param entity {Object} The entity details, containing:
  - @param charm-url {String} The charmstore URL for the entity.
  - @param config {Object} The arbitrary config details, containing:
  - - @param [config-key] {String} The config value.
  - @param constraints {Object} The arbitrary constraints details, containing:
  - - @param [constraint-key] {String} The constraint value.
  - @param exposed {Boolean} Whether the entity is exposed.
  - @param life {String} The lifecycle status of the entity.
  - @param min-units {Integer} The minimum number of units for the entity.
  - @param model-uuid {String} The model uuid this entity belongs to.
  - @param name {String} The name of the entity.
  - @param owner-tag {String} The tag for the owner.
  - @param status {Object} The entity status, containing:
  - - @param current {String} The current entity status.
  - - @param message {String} The status message.
  - - @param since {String} The datetime for when the status was set.
  - - @param version {String} The status version.
  - @param subordinate {Boolean} Whether this is entity is a subordinate.
  - @param workload-version {String} The version of the workload.
  @returns {Object} The parsed entity, containing:
  - @param charmURL {String} The charmstore URL for the entity.
  - @param config {Object} The arbitrary config details, containing
  - - @param [config-key] {String} The config value.
  - @param constraints {Object} The arbitrary constraints details, containing
  - - @param [constraint-key] {String} The constraint value.
  - @param exposed {Boolean} Whether the entity is exposed.
  - @param life {String} The lifecycle status of the entity.
  - @param minUnits {Integer} The minimum number of units for the entity.
  - @param modelUUID {String} The model uuid this entity belongs to.
  - @param name {String} The name of the entity.
  - @param ownerTag {String} The tag for the owner.
  - @param status {Object} The entity status, containing:
  - - @param current {String} The current entity status.
  - - @param message {String} The status message.
  - - @param since {String} The datetime for when the status was set.
  - - @param version {String} The status version.
  - @param subordinate {Boolean} Whether this is entity is a subordinate.
  - @param workloadVersion {String} The version of the workload.
*/
parsers.parseApplication = entity => {
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
  @param response {Object} The collection, containing applications as described
    in parseApplication().
  @returns {Object} The parsed collection, containing applications as described
    in parseApplication().
*/
parsers.parseApplications = response => {
  let entities = {};
  Object.keys(response).forEach(key => {
    entities[key] = parsers.parseApplication(response[key]);
  });
  return entities;
};

/**
  Parse a machine.
  @param entity {Object} The entity details, containing:
  - @param addresses {Array} The list of address objects, containing:
  - - @param value {String} The address.
  - - @param type {String} The address type.
  - - @param scope {String} The address scope.
  - @param agent-status {Object} The agent status, containing:
  - - @param current {String} The current agent status.
  - - @param message {String} The status message.
  - - @param since {String} The datetime for when the status was set.
  - - @param version {String} The status version.
  - @param hardware-characteristics {Object} The arbitrary machine hardware
    details, containing:
  - - @param [characteristic-key] {String} The characteristic value.
  - @param has-vote {Boolean} Whether the entity has a vote.
  - @param id {String} The entity id.
  - @param instance-id {String} The instance id.
  - @param instance-status {Object} The instance status, containing:
  - - @param current {String} The current instance status.
  - - @param message {String} The status message.
  - - @param since {String} The datetime for when the status was set.
  - - @param version {String} The status version.
  - @param jobs {String} The list of job strings.
  - @param life {String} The lifecycle status of the entity.
  - @param model-uuid {String} The model uuid this entity belongs to.
  - @param series {String} The entity series.
  - @param supported-containers {String} The list of supported container strings.
  - @param supported-containers-know {Boolean} Whether the supported containers are known.
  - @param wants-vote {Boolean} Whether the entity wants a vote.
  @returns {Object} The parsed entity, containing:
  - @param addresses {Array} The list of address objects, containing:
  - - @param value {String} The address.
  - - @param type {String} The address type.
  - - @param scope {String} The address scope.
  - @param agentStatus {Object} The agent status, containing:
  - - @param current {String} The current agent status.
  - - @param message {String} The status message.
  - - @param since {String} The datetime for when the status was set.
  - - @param version {String} The status version.
  - @param hardwareCharacteristics {Object} The arbitrary machine hardware
    details, containing:
  - - @param [characteristic-key] {String} The characteristic value.
  - @param hasVote {Boolean} Whether the entity has a vote.
  - @param id {String} The entity id.
  - @param instanceID {String} The instance id.
  - @param instaneStatus {Object} The instance status, containing:
  - - @param current {String} The current instance status.
  - - @param message {String} The status message.
  - - @param since {String} The datetime for when the status was set.
  - - @param version {String} The status version.
  - @param jobs {String} The list of job strings.
  - @param life {String} The lifecycle status of the entity.
  - @param modelUUID {String} The model uuid this entity belongs to.
  - @param series {String} The entity series.
  - @param supportedContainers {String} The list of supported container strings.
  - @param supportedContainersKnow {Boolean} Whether the supported containers are known.
  - @param wantsVote {Boolean} Whether the entity wants a vote.
*/
parsers.parseMachine = entity => {
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
  @param response {Object} The collection, containing machines as described
    in parseMachine().
  @returns {Object} The parsed collection, containing machines as described
    in parseMachine().
*/
parsers.parseMachines = response => {
  let entities = {};
  Object.keys(response).forEach(key => {
    entities[key] = parsers.parseMachine(response[key]);
  });
  return entities;
};

/**
  Parse a relation.
  @param entity {Object} The entity details, containing:
  - @param endpoints {Array} The list of endpoint objects, containing:
  - - @param application-name {String} The application name.
  - - @param relation {Object} The relation details, containing:
  - - - @param name {String} The relation name.
  - - - @param role {String} The relation role.
  - - - @param interface {String} The relation interface.
  - - - @param option {Boolean} Whether the relation is optional.
  - - - @param limit {Integer} The relation limit.
  - - - @param scope {String} The relation scope.
  - @param id {String} The entity id.
  - @param string {String} The entity string.
  - @param model-uuid {String} The model uuid this entity belongs to.
  @returns {Object} The parsed entity, containing:
  - @param endpoints {Array} The list of endpoint objects, containing:
  - - @param applicationName {String} The application name.
  - - @param relation {Object} The relation details, containing:
  - - - @param name {String} The relation name.
  - - - @param role {String} The relation role.
  - - - @param interface {String} The relation interface.
  - - - @param option {Boolean} Whether the relation is optional.
  - - - @param limit {Integer} The relation limit.
  - - - @param scope {String} The relation scope.
  - @param id {String} The entity id.
  - @param string {String} The entity string.
  - @param modelUUID {String} The model uuid this entity belongs to.
*/
parsers.parseRelation = entity => {
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
  @param response {Object} The collection, containing relations as described
    in parseRelation().
  @returns {Object} The parsed collection, containing relations as described
    in parseRelation().
*/
parsers.parseRelations = response => {
  let entities = {};
  Object.keys(response).forEach(key => {
    entities[key] = parsers.parseRelation(response[key]);
  });
  return entities;
};

/**
  Parse a remote application.
  @param entity {Object} The entity details, containing:
  - @param life {String} The lifecycle status of the entity.
  - @param model-uuid {String} The model uuid this entity belongs to.
  - @param name {String} The entity name.
  - @param offer-url {String} The offer URL.
  - @param offer-uuid {String} The offer UUID.
  - @param status {Object} The status, containing:
  - - @param current {String} The current status.
  - - @param message {String} The status message.
  - - @param since {String} The datetime for when the status was set.
  - - @param version {String} The status version.
  @returns {Object} The parsed entity, containing:
  - @param life {String} The lifecycle status of the entity.
  - @param modelUUID {String} The model uuid this entity belongs to.
  - @param name {String} The entity name.
  - @param offerURL {String} The offer URL.
  - @param offerUUID {String} The offer UUID.
  - @param status {Object} The status, containing:
  - - @param current {String} The current status.
  - - @param message {String} The status message.
  - - @param since {String} The datetime for when the status was set.
  - - @param version {String} The status version.
*/
parsers.parseRemoteApplication = entity => {
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
  @param response {Object} The collection, containing remote applications as
    described in parseRemoteApplication().
  @returns {Object} The parsed collection, containing remote applications as
    described in parseRemoteApplication().
*/
parsers.parseRemoteApplications = response => {
  let entities = {};
  Object.keys(response).forEach(key => {
    entities[key] = parsers.parseRemoteApplication(response[key]);
  });
  return entities;
};

/**
  Parse a unit.
  @param entity {Object} The entity details, containing:
  - @param agent-status {Object} The agent status, containing:
  - - @param current {String} The current status.
  - - @param message {String} The status message.
  - - @param since {String} The datetime for when the status was set.
  - - @param version {String} The status version.
  - @param application {String} The application this entity belongs to.
  - @param charm-url {String} The charm URL for this unit.
  - @param machine-id {String} The id of the machine this unit is on.
  - @param model-uuid {String} The model uuid this entity belongs to.
  - @param name {String} The name of the unit.
  - @param port-ranges {Array} The collection of port range objects, containing:
  - - @param from-port {Integer} The start of the port range.
  - - @param to-port {Integer} The end of the port range.
  - - @param protocol {String} The port protocol.
  - @param ports {Array} The collection of port objects, containing:
  - - @param protocol {String} The port protocol.
  - - @param number {Integer} The port number.
  - @param private-address {String} The unit's private address.
  - @param public-address {String} The unit's public address.
  - @param series {String} The series of the unit.
  - @param subordinate {Boolean} Whether the unit is a subordinate.
  - @param workload-status {Object} The workload status, containing:
  - - @param current {String} The current status.
  - - @param message {String} The status message.
  - - @param since {String} The datetime for when the status was set.
  - - @param version {String} The status version.
  @returns {Object} The parsed entity, containing:
  - @param agentStatus {Object} The agent status, containing:
  - - @param current {String} The current status.
  - - @param message {String} The status message.
  - - @param since {String} The datetime for when the status was set.
  - - @param version {String} The status version.
  - @param application {String} The application this entity belongs to.
  - @param charmURL {String} The charm URL for this unit.
  - @param machineId {String} The id of the machine this unit is on.
  - @param modelUUID {String} The model uuid this entity belongs to.
  - @param name {String} The name of the unit.
  - @param portRanges {Array} The collection of port range objects, containing:
  - - @param fromPort {Integer} The start of the port range.
  - - @param toPort {Integer} The end of the port range.
  - - @param protocol {String} The port protocol.
  - @param ports {Array} The collection of port objects, containing:
  - - @param protocol {String} The port protocol.
  - - @param number {Integer} The port number.
  - @param privateAddress {String} The unit's private address.
  - @param publicAddress {String} The unit's public address.
  - @param series {String} The series of the unit.
  - @param subordinate {Boolean} Whether the unit is a subordinate.
  - @param workloadStatus {Object} The workload status, containing:
  - - @param current {String} The current status.
  - - @param message {String} The status message.
  - - @param since {String} The datetime for when the status was set.
  - - @param version {String} The status version.
*/
parsers.parseUnit = entity => {
  return {
    agentStatus: entity['agent-status'] ? {
      current: entity['agent-status'].current,
      message: entity['agent-status'].message,
      since: entity['agent-status'].since,
      version: entity['agent-status'].version
    } : undefined,
    application: entity.application,
    charmURL: entity['charm-url'],
    machineId: entity['machine-id'],
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
  @param response {Object} The collection, containing units as described
    in parseUnit().
  @returns {Object} The parsed collection, containing units as described
    in parseUnit().
*/
parsers.parseUnits = response => {
  let entities = {};
  Object.keys(response).forEach(key => {
    entities[key] = parsers.parseUnit(response[key]);
  });
  return entities;
};

/**
  Parse a full megawatcher object.
  @param response {Object} The collections of entites, containing:
  - @param annotations {Object} The collection of annotations.
  - @param applications {Object} The collection of applications.
  - @param machines {Object} The collection of machines.
  - @param relations {Object} The collection of relations.
  - @param remote-applications {Object} The collection of remote-applications.
  @returns {Object} The parsed collections, containing:
  - @param annotations {Object} The collection of annotations.
  - @param applications {Object} The collection of applications.
  - @param machines {Object} The collection of machines.
  - @param relations {Object} The collection of relations.
  - @param remoteApplications {Object} The collection of remoteApplications.
*/
parsers.parseMegaWatcher = response => {
  return {
    annotations: parsers.parseAnnotations(response.annotations),
    applications: parsers.parseApplications(response.applications),
    machines: parsers.parseMachines(response.machines),
    relations: parsers.parseRelations(response.relations),
    remoteApplications: parsers.parseRemoteApplications(response['remote-applications']),
    units: parsers.parseUnits(response.units)
  };
};

module.exports = parsers;
