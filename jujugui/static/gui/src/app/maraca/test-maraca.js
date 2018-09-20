/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const clone = require('lodash.clone');

const Maraca = require('./maraca');
const parsers = require('./parsers');

describe('Maraca', () => {
  let maraca, onChange;

  beforeEach(() => {
    onChange = sinon.stub();
    maraca = new Maraca({
      changeEvent: 'all_watcher_event',
      onChange: onChange
    });
  });

  it('inits correctly', () => {
    assert.equal(maraca.CHANGE_EVENT, 'all_watcher_event');
    assert.equal(maraca.ON_CHANGE, onChange);
  });

  it('connects to events', () => {
    const listener = sinon.stub();
    document.addEventListener('all_watcher_event', listener);
    maraca.connect();
    document.dispatchEvent(new CustomEvent('all_watcher_event', {
      detail: {
        response: {
          deltas: []
        }
      }
    }));
    assert.equal(onChange.calledOnce, true);
    document.removeEventListener('all_watcher_event', listener);
  });

  it('disconnects from events', () => {
    const listener = sinon.stub();
    document.addEventListener('all_watcher_event', listener);
    maraca.connect();
    maraca.disconnect();
    document.dispatchEvent(new CustomEvent('all_watcher_event', {
      detail: {
        response: {
          deltas: []
        }
      }
    }));
    assert.equal(onChange.calledOnce, false);
    document.removeEventListener('all_watcher_event', listener);
  });

  it('adds entities', () => {
    maraca._watcherListener({
      detail: {
        response: {
          deltas: [[
            'unit', 'change', {
              name: 'apache2/0'
            }
          ]]
        }
      }
    });
    assert.deepEqual(maraca.values.units, {
      'apache2/0': parsers.parseUnit({
        name: 'apache2/0'
      })
    });
  });

  it('updates entities', () => {
    maraca._watcherListener({
      detail: {
        response: {
          deltas: [[
            'unit', 'change', {
              name: 'apache2/0',
              series: 'trusty'
            }
          ]]
        }
      }
    });
    assert.deepEqual(maraca.values.units, {
      'apache2/0': parsers.parseUnit({
        name: 'apache2/0',
        series: 'trusty'
      })
    });
    maraca._watcherListener({
      detail: {
        response: {
          deltas: [[
            'unit', 'change', {
              name: 'apache2/0',
              series: 'wily'
            }
          ]]
        }
      }
    });
    assert.deepEqual(maraca.values.units, {
      'apache2/0': parsers.parseUnit({
        name: 'apache2/0',
        series: 'wily'
      })
    });
  });

  it('removes entities', () => {
    maraca._watcherListener({
      detail: {
        response: {
          deltas: [[
            'unit', 'change', {
              name: 'apache2/0'
            }
          ]]
        }
      }
    });
    assert.deepEqual(maraca.values.units, {
      'apache2/0': parsers.parseUnit({
        name: 'apache2/0'
      })
    });
    maraca._watcherListener({
      detail: {
        response: {
          deltas: [[
            'unit', 'remove', {
              name: 'apache2/0'
            }
          ]]
        }
      }
    });
    assert.deepEqual(maraca.values.units, {});
  });

  it('can handle remote applications', () => {
    maraca._watcherListener({
      detail: {
        response: {
          deltas: [[
            'remote-application', 'change', {
              name: 'apache2'
            }
          ]]
        }
      }
    });
    assert.deepEqual(maraca.values.remoteApplications, {
      apache2: parsers.parseRemoteApplication({
        name: 'apache2'
      })
    });
  });

  it('can handle applications', () => {
    maraca._watcherListener({
      detail: {
        response: {
          deltas: [[
            'application', 'change', {
              name: 'apache2'
            }
          ]]
        }
      }
    });
    assert.deepEqual(maraca.values.applications, {
      apache2: parsers.parseApplication({
        name: 'apache2'
      })
    });
  });

  it('can handle units', () => {
    maraca._watcherListener({
      detail: {
        response: {
          deltas: [[
            'unit', 'change', {
              name: 'apache2/0'
            }
          ]]
        }
      }
    });
    assert.deepEqual(maraca.values.units, {
      'apache2/0': parsers.parseUnit({
        name: 'apache2/0'
      })
    });
  });

  it('can handle machines', () => {
    maraca._watcherListener({
      detail: {
        response: {
          deltas: [[
            'machine', 'change', {
              id: '0'
            }
          ]]
        }
      }
    });
    assert.deepEqual(maraca.values.machines, {
      0: parsers.parseMachine({
        id: '0'
      })
    });
  });

  it('can handle relations', () => {
    maraca._watcherListener({
      detail: {
        response: {
          deltas: [[
            'relation', 'change', {
              id: '1'
            }
          ]]
        }
      }
    });
    assert.deepEqual(maraca.values.relations, {
      1: parsers.parseRelation({
        id: '1'
      })
    });
  });

  it('can handle annotations', () => {
    maraca._watcherListener({
      detail: {
        response: {
          deltas: [[
            'annotation', 'change', {
              tag: 'application-apache2'
            }
          ]]
        }
      }
    });
    assert.deepEqual(maraca.values.annotations, {
      'application-apache2': parsers.parseAnnotation({
        tag: 'application-apache2'
      })
    });
  });

  it('can handle unkown entities', () => {
    // Get a clone of the empty object shape.
    const empty = clone(maraca.values);
    maraca._watcherListener({
      detail: {
        response: {
          deltas: [[
            'nothing-here', 'change', {
              id: '1'
            }
          ]]
        }
      }
    });
    assert.deepEqual(maraca.values, empty);
  });
});
