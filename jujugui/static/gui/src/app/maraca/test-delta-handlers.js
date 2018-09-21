/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const handlers = require('./delta-handlers');
const parsers = require('./parsers');

describe('delta handlers', () => {
  it('adds/updates entities', () => {
    const updates = handlers.processDeltas([[
      'unit', 'change', {
        name: 'apache2/0'
      }
    ]]);
    assert.deepEqual(updates.changed.units, {
      'apache2/0': parsers.parseUnit({
        name: 'apache2/0'
      })
    });
  });

  it('removes entities', () => {
    const updates = handlers.processDeltas([[
      'unit', 'remove', {
        name: 'apache2/0'
      }
    ]]);
    assert.deepEqual(updates.removed.units, {
      'apache2/0': parsers.parseUnit({
        name: 'apache2/0'
      })
    });
  });

  it('can handle remote applications', () => {
    const updates = handlers.processDeltas([[
      'remote-application', 'change', {
        name: 'apache2'
      }
    ]]);
    assert.deepEqual(updates.changed.remoteApplications, {
      apache2: parsers.parseRemoteApplication({
        name: 'apache2'
      })
    });
  });

  it('can handle applications', () => {
    const updates = handlers.processDeltas([[
      'application', 'change', {
        name: 'apache2'
      }
    ]]);
    assert.deepEqual(updates.changed.applications, {
      apache2: parsers.parseApplication({
        name: 'apache2'
      })
    });
  });

  it('can handle units', () => {
    const updates = handlers.processDeltas([[
      'unit', 'change', {
        name: 'apache2/0'
      }
    ]]);
    assert.deepEqual(updates.changed.units, {
      'apache2/0': parsers.parseUnit({
        name: 'apache2/0'
      })
    });
  });

  it('can handle machines', () => {
    const updates = handlers.processDeltas([[
      'machine', 'change', {
        id: '0'
      }
    ]]);
    assert.deepEqual(updates.changed.machines, {
      0: parsers.parseMachine({
        id: '0'
      })
    });
  });

  it('can handle relations', () => {
    const updates = handlers.processDeltas([[
      'relation', 'change', {
        id: '1'
      }
    ]]);
    assert.deepEqual(updates.changed.relations, {
      1: parsers.parseRelation({
        id: '1'
      })
    });
  });

  it('can handle annotations', () => {
    const updates = handlers.processDeltas([[
      'annotation', 'change', {
        tag: 'application-apache2'
      }
    ]]);
    assert.deepEqual(updates.changed.annotations, {
      'application-apache2': parsers.parseAnnotation({
        tag: 'application-apache2'
      })
    });
  });

  it('can handle unkown entities', () => {
    const updates = handlers.processDeltas([[
      'nothing-here', 'change', {
        id: '1'
      }
    ]]);
    assert.deepEqual(updates.changed, {});
  });
});
