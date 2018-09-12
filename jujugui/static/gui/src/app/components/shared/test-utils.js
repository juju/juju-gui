/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const utils = require('./utils');

describe('Shared utils', () => {
  describe('getHighestStatus', () => {
    it('gets the highest status with known statuses', () => {
      assert.equal(utils.getHighestStatus(['ok', 'pending']), 'pending');
    });

    it('gets the highest status with unknown statuses', () => {
      assert.equal(utils.getHighestStatus(['ok', 'down']), 'error');
    });
  });

  describe('normaliseStatus', () => {
    it('normalises an OK status', () => {
      assert.equal(utils.normaliseStatus('idle'), 'ok');
    });

    it('normalises a pending status', () => {
      assert.equal(utils.normaliseStatus('installing'), 'pending');
    });

    it('normalises an error status', () => {
      assert.equal(utils.normaliseStatus('blocked'), 'error');
    });

    it('normalises an unkown status', () => {
      assert.equal(utils.normaliseStatus('peachy'), 'ok');
    });
  });

  describe('getStatusClass', () => {
    it('creates a class name', () => {
      assert.equal(utils.getStatusClass('status--', 'ok'), 'status--ok');
    });

    it('creates a normalised class name', () => {
      assert.equal(utils.getStatusClass('status--', 'idle'), 'status--ok');
    });

    it('creates a class name with priority', () => {
      assert.equal(utils.getStatusClass('status--', ['idle', 'blocked']), 'status--error');
    });

    it('handles a blank status', () => {
      assert.strictEqual(utils.getStatusClass('status--', null), '');
    });
  });

  describe('getRealUnits', () => {
    it('includes units with machines', () => {
      assert.deepEqual(utils.getRealUnits([{
        id: 1,
        machine: '0'
      }, {
        id: 2
      }]), [{
        id: 1,
        machine: '0'
      }]);
    });

    it('does not units on uncommitted machines', () => {
      assert.deepEqual(utils.getRealUnits([{
        id: 1,
        machine: 'new0'
      }, {
        id: 2,
        machine: '1'
      }]), [{
        id: 2,
        machine: '1'
      }]);
    });
  });
});
