/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

/**
  Create a hash of a string. From stackoverflow: http://goo.gl/PEOgF
  @param {String} value The string to hash.
  @return {Integer} The hash of the string.
 */
function generateHash(value) {
  return value.split('').reduce(
    (hash, character) => {
      hash = ((hash << 5) - hash) + character.charCodeAt(0);
      return hash & hash;
    }, 0);
}

/**
  Create a stable, safe DOM id given an arbitrary string.
  See details and discussion in
  https://bugs.launchpad.net/juju-gui/+bug/1167295
  @param {String} value The string to hash.
  @param {String} parentId An optional id for the parent module or node
    for instances in which a 'value' may have duplicates in other areas.
  @return {String} The calculated DOM id.
 */
function generateSafeDOMId(value, parentId = '') {
  return (
    'e-' + value.replace(/\W/g, '_') + '-' +
      generateHash(value + parentId));
}

/**
   Return relation objects attached to the application
   @param {Database} db to resolve charms/services on.
   @param {Object} application in which we want the relations attached too
   @param {Object} withApplication an optional parameter used to filter the
    returning array by relations that match both endpoints
 */
function getRelationDataForService(db, application, withApplication) {
  let relationsArray = db.relations.get_relations_for_service(application);

  // If withApplication is supplied the relationsArray is filtered by
  // endpoints that are unique between application and withApplication.
  if (withApplication !== undefined) {
    const withApplicationName = withApplication.get('id');
    relationsArray = relationsArray.filter(relation => {
      const rel = relation.getAttrs();
      if (rel.endpoints[0][0] === withApplicationName ||
        rel.endpoints[1][0] === withApplicationName) {
        return relation;
      }
    });
  }

  // Return a list of objects representing the `near` and `far`
  // endpoints for all of the relationships `rels`.  If it is a peer
  // relationship, then `far` will be undefined.
  const applicationName = application.get('id');
  return relationsArray.map(relation => {
    const rel = relation.getAttrs();
    let near, far;
    if (rel.endpoints[0][0] === applicationName) {
      near = rel.endpoints[0];
      far = rel.endpoints[1]; // undefined if a peer relationship.
    } else {
      near = rel.endpoints[1];
      far = rel.endpoints[0];
    }
    rel.near = {
      service: near[0],
      serviceName: application.get('name'),
      role: near[1].role,
      name: near[1].name
    };
    let farService;
    // far will be undefined or the far endpoint service.
    if (far) {
      const id = far[0];
      const application = db.services.getById(id);
      // The uncommitted application could been removed so check it is
      // really there.
      if (application) {
        farService = {
          service: id,
          serviceName: application.get('name'),
          role: far[1].role,
          name: far[1].name
        };
      }
    }
    rel.far = farService;
    rel.ident = rel.relation_id;
    rel.elementId = generateSafeDOMId(rel.relation_id);
    return rel;
  });
};

/**
  Takes two string endpoints and splits it into usable parts.
  @param {Database} db to resolve charms/services on.
  @param {Array} endpoints an array of endpoint strings
    to split in the format wordpress:db.
  @return {Object} An Array of parsed endpoints, each containing name, type
  and the related charm. Name is the user defined service name and type is
  the charms authors name for the relation type.
 */
function parseEndpointStrings(db, endpoints) {
  return endpoints.map(endpoint => {
    const epData = endpoint.split(':');
    const result = {};
    if (epData.length > 1) {
      result.name = epData[0];
      result.type = epData[1];
    } else {
      result.name = epData[0];
    }
    result.service = db.services.getById(result.name);
    if (result.service) {
      result.charm = db.charms.getById(
        result.service.get('charm'));
      if (!result.charm) {
        console.warn('Failed to load charm',
          result.charm, db.charms.size(), db.charms.get('id'));
      }
    } else {
      console.warn('failed to resolve service', result.name);
    }
    return result;
  });
};

/**
  Loops through the charm endpoint data to determine whether we have a
  relationship match. The result is either an object with an error
  attribute, or an object giving the interface, scope, providing endpoint,
  and requiring endpoint.
  @param {Array} endpoints Pair of two endpoint data objects.  Each
  endpoint data object has name, charm, service, and scope.
  @return {Object} A hash with the keys 'interface', 'scope', 'provides',
  and 'requires'.
 */
function findEndpointMatch(endpoints) {
  const matches = [];
  let result;
  [0, 1].forEach(providedIndex => {
    // Identify the candidates.
    const providingEndpoint = endpoints[providedIndex];
    // The merges here result in a shallow copy.
    const provides = Object.assign({}, providingEndpoint.charm.get('provides'));
    const requiringEndpoint = endpoints[!providedIndex + 0];
    const requires = Object.assign({}, requiringEndpoint.charm.get('requires'));
    if (!provides['juju-info']) {
      provides['juju-info'] = {'interface': 'juju-info', scope: 'container'};
    }
    // Restrict candidate types as tightly as possible.
    let candidateProvideTypes, candidateRequireTypes;
    if (providingEndpoint.type) {
      candidateProvideTypes = [providingEndpoint.type];
    } else {
      candidateProvideTypes = Object.keys(provides);
    }
    if (requiringEndpoint.type) {
      candidateRequireTypes = [requiringEndpoint.type];
    } else {
      candidateRequireTypes = Object.keys(requires);
    }
    // Find matches for candidates and evaluate them.
    candidateProvideTypes.forEach(provideType => {
      candidateRequireTypes.forEach(requireType => {
        const provideMatch = provides[provideType];
        const requireMatch = requires[requireType];
        if (provideMatch &&
            requireMatch &&
            provideMatch['interface'] === requireMatch['interface']) {
          matches.push({
            'interface': provideMatch['interface'],
            scope: provideMatch.scope || requireMatch.scope,
            provides: providingEndpoint,
            requires: requiringEndpoint,
            provideType: provideType,
            requireType: requireType
          });
        }
      });
    });
  });
  if (matches.length === 0) {
    const message = 'Specified relation is unavailable.';
    console.error(message, endpoints);
    result = {error: message};
  } else if (matches.length > 1) {
    // It's only a problem if there's more than one explicit relation.
    // Otherwise, filter out the implicit relations and just return the
    // explicit relation.
    const explicitRelations = matches.filter(
      rel => rel['provideType'] !== 'juju-info');
    if (explicitRelations.length === 0) {
      const message = 'No explicitly specified relations are available.';
      console.error(message, endpoints);
      result = {error: message};
    } else if (explicitRelations.length > 1) {
      result = {error: 'Ambiguous relationship is not allowed.'};
    } else {
      result = explicitRelations[0];
    }
  } else {
    result = matches[0];
    // Specify the type for implicit relations.
    result.provides = Object.assign({}, result.provides);
    result.requires = Object.assign({}, result.requires);
    result.provides.type = result.provideType;
    result.requires.type = result.requireType;
  }
  return result;
};

/**
  Decorate a relation with some related/derived data.
  @param {Object} relation The model object we will be based on.
  @param {Object} source The service from which the relation originates.
  @param {Object} target The service at which the relation terminates.
  @return {Object} An object with attributes matching the result of
    relation.getAttrs() plus "source", "target", and other convenience data.
*/
function DecoratedRelation(relation, source, target) {
  // In some instances, notably in tests, a relation is a POJO already;
  // handle this case gracefully.
  const endpoints = relation.endpoints || relation.get('endpoints');
  const hasRelations = !!endpoints;
  const decorated = {
    source: source,
    target: target,
    sourceId: (hasRelations ? (endpoints[0][0] + ':' +
        endpoints[0][1].name) : ''),
    targetId: (hasRelations ? (endpoints[1][0] + ':' +
        endpoints[1][1].name) : ''),
    compositeId:
        (source.modelId +
        (hasRelations ? ':' + endpoints[0][1].name : '') + '-' +
        target.modelId +
        (hasRelations ? ':' + endpoints[1][1].name : ''))
  };
  /**
    Test whether or not any of the units within the service have any errors
    relevant to the relation.
    @param {Object} service A BoxModel-wrapped service.
    @return {Boolean} Whether or not the service has pertinent errors.
  */
  decorated._endpointHasError = function(service) {
    // Find the endpoints pertinent to each end of the service.
    const endpoint = this.endpoints[0][0] === service.id ?
      this.endpoints[0] : this.endpoints[1];
    // Search the units belonging to the source service for pertinent units
    // in error.
    // Repeat the search for the target service's units.  This relies
    // heavily on short-circuit logic: 'some' will short-circuit at the first
    // match, '&&' will short-circuit out on any unit not in error, and the
    // '||' will short-circuit if the source units are in error.
    return service.units.toArray().some(unit => {
      // Figure out whether or not the unit is in error.
      const relationName = endpoint[1].name + '-' + 'relation';
      const agentStateData = unit.agent_state_data;
      const agentStateInfo = unit.agent_state_info;
      let relationError = false;
      // Now we need to determine if the error is relation-related.
      // First check the agent_state_data field.
      if (agentStateData && agentStateData.hook) {
        relationError = (agentStateData.hook.indexOf(relationName) === 0);
      }
      // Next check the agent_state_info field. In error situations, this
      // field may have a message like 'hook failed: "foobar-relation-joined"'
      // so we just need to see if the relation name is a substring.
      if (!relationError && agentStateInfo) {
        relationError = (agentStateInfo.indexOf(relationName) >= 0);
      }
      return unit.agent_state === 'error' && relationError;
    });
  };
  /**
    Simple wrapper for template use to check whether the source has units
    in error pertinent to the relation.
    @return {Boolean} Whether or not the source has pertinent errors.
  */
  decorated.sourceHasError = function() {
    return this._endpointHasError(this.source);
  };
  /**
    Simple wrapper for template use to check whether the target has units
    in error pertinent to the relation.
    @return {Boolean} Whether or not the target has pertinent errors.
  */
  decorated.targetHasError = function() {
    return this._endpointHasError(this.target);
  };
  /**
    Simple wrapper for template use to check whether the relation has units
    in error pertinent to the relation.
    @return {Boolean} Whether or not the relation has pertinent errors.
  */
  decorated.hasRelationError = function() {
    return this.sourceHasError() || this.targetHasError();
  };
  Object.assign(decorated, relation.getAttrs());
  decorated.isSubordinate = isSubordinateRelation(decorated);
  return decorated;
};

function isSubordinateRelation(relation) {
  // Pending relations that are currently in the process of being created
  // will not necessarily have a target and a source; so check for them
  // first before checking whether target or source is a subordinate.
  const source = relation.source;
  const target = relation.target;
  let subordinateModel = true;
  if (target && source) {
    subordinateModel = target.model.get('subordinate') ||
        source.model.get('subordinate');
  }
  // Relation types of juju-info may have a relation scope of container
  // without necessarily being an actual subordinate relation by virtue of
  // the fact that the service itself may not actually be a subordinate; thus,
  // make sure that at least one of the services is a subordinate *and* the
  // scope is container (which may be inverted, e.g.: puppet and puppetmaster)
  return subordinateModel && relation.scope === 'container';
};

const _relationCollection = {};

/*
  Fill out properties of related collections.  These mostly just aggregate
  various relation attributes in ways conducive to displaying a collection
  of relations appropriately.
*/
Object.defineProperties(_relationCollection, {
  aggregatedStatus: {
    get: function() {
      // Return pending if any of the relations are pending.
      // Note that by "pending" in this context we mean the relation is added
      // between two ghost/uncommitted services.
      const pending = this.relations.some(relation => relation.pending);
      if (pending) {
        return 'pending';
      }
      // Return unhealthy regardless of subordinate status if any of the
      // relations are in error.
      const unhealthy = this.relations.some(relation => relation.hasRelationError());
      const pendingDeletion = this.relations.some(relation => relation.deleted);
      if (unhealthy) {
        return (pendingDeletion ? 'pending-' : '') + 'error';
      }
      // Return subordinate if the collection is marked as such, otherwise
      // return healthy.
      if (this.isSubordinate) {
        return 'subordinate';
      } else {
        return (pendingDeletion ? 'pending-' : '') + 'healthy';
      }
    }
  },
  isSubordinate: {
    get: function() {
      return this.relations.every(relation => relation.isSubordinate);
    }
  }
});

/**
  Constructor for creating a relation-collection between two services,
  possibly consisting of multiple actual relations.
  @param {Object} source The source-service.
  @param {Object} target The target-service.
  @param {Array} relations An array of relations connecting those two
    services.
  @return {RelationCollection} A relation collection.
*/
function RelationCollection(source, target, relations) {
  const collection = Object.create(_relationCollection);
  collection.source = source;
  collection.target = target;
  collection.relations = relations;
  collection.id = relations[0].id;
  collection.compositeId = relations[0].id;
  return collection;
}

/**
  Given a list of decorated relations, return a list of relation collections
  such that multiple relations between the same two services will wind up
  in the same collection.
  @param {Array} relations An array of decorated relations.
  @return {Array} An array of relation collections.
*/
function toRelationCollections(relations) {
  const collections = {};
  relations.forEach(relation => {
    // Create a regular key for each pair of services; use sort so that
    // each relation between the same two services creates the same key
    // regardless of whether it's considered the source or the target.
    const key = [relation.source.modelId, relation.target.modelId].sort().join();
    if (collections[key]) {
      collections[key].relations.push(relation);
    } else {
      collections[key] = new RelationCollection(
        relation.source, relation.target, [relation]);
    }
  });
  // Dump just the collections; the keys are not needed for the data that
  // is used in the view, which only expects an array of relationships.
  return Object.keys(collections).map(key => collections[key]);
};

/**
  Destory a list of relations.
  @param {Database} db to resolve relations on.
  @param {Object} env The current environment.
  @param {Array} relations A list of relation ids.
  @param {Function} callback A function to call after removal.
*/
function destroyRelations(db, env, relations, callback) {
  relations.forEach(relationId => {
    const endpoints = db.relations.getById(relationId).get('endpoints');
    env.remove_relation(endpoints[0], endpoints[1], callback);
  });
};

/**
  Create a relation.
  @param {Object} db Reference to the db instance.
  @param {Object} env The current environment.
  @param {Array} endpoints A list of relation endpoints.
  @param {Function} callback A function to call after removal.
*/
function createRelation(db, env, endpoints, callback) {
  const endpointData = parseEndpointStrings(
    db, [endpoints[0][0], endpoints[1][0]]);
  const match = findEndpointMatch(endpointData);
  const relationId = `pending-${endpoints[0][0]}:${endpoints[0][1].name}` +
    `${endpoints[1][0]}:${endpoints[1][1].name}`;
  const application1 = endpointData[0].service;
  const application2 = endpointData[1].service;
  let subordinate;
  let application;
  // If either of the applications is a subordinate then assign the
  // variable appropriately.
  if (application1.get('subordinate')) {
    subordinate = application1;
    application = application2;
  } else if (application2.get('subordinate')) {
    subordinate = application2;
    application = application1;
  }
  if (subordinate) {
    const appSeries = application.get('series');
    // If the selected subordinate series does not match the application we
    // are relating it to and it is on a 'container' scope then it must be
    // a multi-series subordinate and we need to update the series to match.
    if (subordinate.get('series') !== appSeries) {
      // If the scope isn't container then the series doesn't matter.
      if (match.scope === 'container') {
        const existingRelations = getRelationDataForService(
          db, subordinate);
        // If there is an existing relation then we don't want to update the
        // relation otherwise it will not match the existing application.
        if (existingRelations.length === 0) {
          // Update the subordinate series to match the application. We know
          // that the subordinate is a multi-series charm with a series that
          // matches the application otherwise we would not have got matching
          // endpoints.
          subordinate.set('series', appSeries);
        } else {
          // If there is an existing relation then show an error and cancel
          // adding the relation.
          db.notifications.add({
            title: 'Subordinate series does not match',
            message: 'Subordinates can only have a container scoped ' +
              'relation between applications with the same series. ' +
              'This subordinate already has a relation to an application ' +
              'with a different series.',
            level: 'error'
          });
          return;
        }
      }
    }
  }
  db.relations.add({
    relation_id: relationId,
    'interface': match.interface,
    endpoints: endpoints,
    pending: true,
    scope: match.scope || 'global',
    display_name: 'pending'
  });
  env.add_relation(
    endpoints[0], endpoints[1],
    e => {
      db.relations.remove(db.relations.getById(relationId));
      db.relations.create({
        relation_id: e.result.id,
        type: e.result['interface'],
        endpoints: endpoints,
        pending: false,
        scope: e.result.scope
      });
    });
};

/**
  Returns an array of relation types for the passed applications
  @param {Object} endpointsController a reference to the endpoints
    Controller instance
  @param {Object} db a reference to the db instance
  @param {Function} getEndpoints reference to the models.getEndpoints method
  @param {Object} applicationFrom the application to relate from.
  @param {Object} applicationTo the application to relate to.
  @param {Object} existingData (optional) If you want to suply existing data
    instead of requesting the relation data from the service. This is typically
    only used for testing.
  @returns {Array} The relations that are compatible.
*/
function getAvailableEndpoints(
  endpointsController, db, getEndpoints, applicationFrom, applicationTo, existingData = null) {
  // Get the endpoints that are possible to relate to.
  const relatableEndpoints = getEndpoints(
    applicationFrom, endpointsController)[applicationTo.get('id')];

  let existing = (existingData !== null) ? existingData :
    getRelationDataForService(db, applicationTo, applicationFrom);

  if (existing.length === 0) {
    return relatableEndpoints;
  }
  // Filter out the existing relations
  return relatableEndpoints.filter(relation =>
    !existing.some(existingRelation =>
      relation[0].name === existingRelation.far.name ||
      relation[1].name === existingRelation.near.name
    ));
};

/**
  Returns a list of relatable applications
  @param {Object} db Reference to the db instance.
  @param {Object} endpoints An object of endpoints with the keys being
    the service name.
  @returns {Array} The service objects that can related to the application.
*/
function getRelatableApplications(db, endpoints) {
  return Object.keys(endpoints)
    .map(appName => db.services.getById(appName));
};


module.exports = {
  generateHash,
  generateSafeDOMId,
  getRelationDataForService,
  parseEndpointStrings,
  findEndpointMatch,
  DecoratedRelation,
  isSubordinateRelation,
  RelationCollection,
  toRelationCollections,
  destroyRelations,
  createRelation,
  getAvailableEndpoints,
  getRelatableApplications
};
