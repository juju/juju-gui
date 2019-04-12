/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const shapeup = require('shapeup');

let propTypes = {};

/**
  The shape of an annotation.
*/
propTypes.annotation = shapeup.shape({
  annotations: PropTypes.shape({
    bundleURL: PropTypes.string,
    guiX: PropTypes.string,
    guiY: PropTypes.string
  }),
  modelUUID: PropTypes.string,
  tag: PropTypes.stringg
});

/**
  The shape of an application.
*/
propTypes.application = shapeup.shape({
  charmURL: PropTypes.string,
  config: PropTypes.object,
  constraints: PropTypes.object,
  exposed: PropTypes.bool,
  life: PropTypes.string,
  minUnits: PropTypes.number,
  modelUUID: PropTypes.string,
  name: PropTypes.string,
  ownerTag: PropTypes.string,
  status: PropTypes.shape({
    current: PropTypes.string,
    message: PropTypes.string,
    since: PropTypes.string,
    version: PropTypes.string
  }),
  subordinate: PropTypes.bool,
  workloadVersion: PropTypes.string
});

/**
  The shape of a machine.
*/
propTypes.machine = shapeup.shape({
  addresses: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    type: PropTypes.string,
    scope: PropTypes.string
  })),
  agentStatus: PropTypes.shape({
    current: PropTypes.string,
    message: PropTypes.string,
    since: PropTypes.string,
    version: PropTypes.string
  }),
  hardwareCharacteristics: PropTypes.object,
  hasVote: PropTypes.bool,
  id: PropTypes.string,
  instanceID: PropTypes.string,
  instanceStatus: PropTypes.shape({
    current: PropTypes.string,
    message: PropTypes.string,
    since: PropTypes.string,
    version: PropTypes.string
  }),
  jobs: PropTypes.arrayOf(PropTypes.string),
  life: PropTypes.string,
  modelUUID: PropTypes.string,
  series: PropTypes.string,
  supportedContainers: PropTypes.arrayOf(PropTypes.string),
  supportedContainersKnown: PropTypes.bool,
  wantsVote: PropTypes.bool
});

/**
  The shape of a relation.
*/
propTypes.relation = shapeup.shape({
  endpoints: PropTypes.arrayOf(PropTypes.shape({
    applicationName: PropTypes.string,
    relation: PropTypes.shape({
      name: PropTypes.string,
      role: PropTypes.string,
      'interface': PropTypes.string,
      optional: PropTypes.bool,
      limit: PropTypes.number,
      scope: PropTypes.stringe
    })
  })),
  id: PropTypes.number,
  key: PropTypes.string,
  modelUUID: PropTypes.string
});

/**
  The shape of a remote application.
*/
propTypes.remoteApplication = shapeup.shape({
  life: PropTypes.string,
  modelUUID: PropTypes.string,
  name: PropTypes.string,
  offerURL: PropTypes.string,
  offerUUID: PropTypes.string,
  status: PropTypes.shape({
    current: PropTypes.string,
    message: PropTypes.string,
    since: PropTypes.string,
    version: PropTypes.string
  })
});

/**
  The shape of a unit.
*/
propTypes.unit = shapeup.shape({
  agentStatus: PropTypes.shape({
    current: PropTypes.string,
    message: PropTypes.string,
    since: PropTypes.string,
    version: PropTypes.stringn
  }),
  application: PropTypes.string,
  charmURL: PropTypes.string,
  machineID: PropTypes.string,
  modelUUID: PropTypes.string,
  name: PropTypes.string,
  portRanges: PropTypes.arrayOf(PropTypes.shape({
    fromPort: PropTypes.number,
    toPort: PropTypes.number,
    protocol: PropTypes.string
  })),
  ports: PropTypes.arrayOf(PropTypes.shape({
    protocol: PropTypes.string,
    number: PropTypes.number
  })),
  privateAddress: PropTypes.string,
  publicAddress: PropTypes.string,
  series: PropTypes.string,
  subordinate: PropTypes.bool,
  workloadStatus: PropTypes.shape({
    current: PropTypes.string,
    message: PropTypes.string,
    since: PropTypes.string,
    version: PropTypes.string
  })
});

/**
  The shape of a collection of annotations.
*/
propTypes.annotations = PropTypes.objectOf(propTypes.annotations);

/**
  The shape of a collection of applications.
*/
propTypes.applications = PropTypes.objectOf(propTypes.application);

/**
  The shape of a collection of machines.
*/
propTypes.machines = PropTypes.objectOf(propTypes.machine);

/**
  The shape of a collection of relations.
*/
propTypes.relations = PropTypes.objectOf(propTypes.relation);

/**
  The shape of a collection of remote applications.
*/
propTypes.remoteApplications = PropTypes.objectOf(propTypes.remoteApplication);

/**
  The shape of a collection of units.
*/
propTypes.units = PropTypes.objectOf(propTypes.unit);

/**
  The shape of the complete value store.
*/
propTypes.valueStore = shapeup.shape({
  annotations: propTypes.annotations,
  applications: propTypes.applications,
  machines: propTypes.machines,
  relations: propTypes.relations,
  remoteApplications: propTypes.remoteApplications,
  units: propTypes.units
});

module.exports = propTypes;
