/* Copyright (C) 2018 Canonical Ltd. */
'use strict';


const MegaWatcher = require('./mega-watcher');

describe('Machine', () => {
  let megaWatcher, onChange;

  beforeEach(() => {
    onChange = sinon.stub();
    megaWatcher = new MegaWatcher({
      changeEvent: 'all_watcher_event',
      onChange: onChange
    });
  });

  it('inits correctly', () => {
    assert.equal(megaWatcher.ALL_WATCHER_EVENT, 'all_watcher_event');
    assert.equal(megaWatcher.ON_CHANGE, onChange);
  });

  it('connects to events', () => {
    const listener = sinon.stub();
    document.addEventListener('all_watcher_event', listener);
    megaWatcher.connect();
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
    megaWatcher.connect();
    megaWatcher.disconnect();
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
    megaWatcher._watcherListener({
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
    assert.deepEqual(megaWatcher.entities.units, {
      'apache2/0': {
        name: 'apache2/0'
      }
    });
  });

  it('updates entities', () => {
    megaWatcher._watcherListener({
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
    assert.deepEqual(megaWatcher.entities.units, {
      'apache2/0': {
        name: 'apache2/0',
        series: 'trusty'
      }
    });
    megaWatcher._watcherListener({
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
    assert.deepEqual(megaWatcher.entities.units, {
      'apache2/0': {
        name: 'apache2/0',
        series: 'wily'
      }
    });
  });

  it('removes entities', () => {
    megaWatcher._watcherListener({
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
    assert.deepEqual(megaWatcher.entities.units, {
      'apache2/0': {
        name: 'apache2/0'
      }
    });
    megaWatcher._watcherListener({
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
    assert.deepEqual(megaWatcher.entities.units, {});
  });

  it('can handle remote applications', () => {
    megaWatcher._watcherListener({
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
    assert.deepEqual(megaWatcher.entities['remote-applications'], {
      apache2: {
        name: 'apache2'
      }
    });
  });

  it('can handle applications', () => {
    megaWatcher._watcherListener({
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
    assert.deepEqual(megaWatcher.entities.applications, {
      apache2: {
        name: 'apache2'
      }
    });
  });

  it('can handle units', () => {
    megaWatcher._watcherListener({
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
    assert.deepEqual(megaWatcher.entities.units, {
      'apache2/0': {
        name: 'apache2/0'
      }
    });
  });

  it('can handle machines', () => {
    megaWatcher._watcherListener({
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
    assert.deepEqual(megaWatcher.entities.machines, {
      0: {
        id: '0'
      }
    });
  });

  it('can handle relations', () => {
    megaWatcher._watcherListener({
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
    assert.deepEqual(megaWatcher.entities.relations, {
      1: {
        id: '1'
      }
    });
  });

  it('can handle annotations', () => {
    megaWatcher._watcherListener({
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
    assert.deepEqual(megaWatcher.entities.annotations, {
      'application-apache2': {
        tag: 'application-apache2'
      }
    });
  });

  it('can handle unkown entities', () => {
    // Get a clone of the empty object shape.
    const empty = JSON.parse(JSON.stringify(megaWatcher.entities));
    megaWatcher._watcherListener({
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
    assert.deepEqual(megaWatcher.entities, empty);
  });
});
