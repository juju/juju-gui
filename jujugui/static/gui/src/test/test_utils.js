/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const utils = require('../app/views/utils');

(function() {
  describe('utils.ensureTrailingSlash', function() {
    it('adds a trailing slash if not already there', function() {
      var text = utils.ensureTrailingSlash('/foo/bar');
      assert.strictEqual(text, '/foo/bar/');
    });

    it('avoids adding a trailing slash if not required', function() {
      var text = utils.ensureTrailingSlash('/foo/bar/');
      assert.strictEqual(text, '/foo/bar/');
    });
  });

  describe('getIconPath', function() {
    let jujuConfig;

    beforeEach(() => {
      jujuConfig = window.juju_config;
      window.juju_config = {charmstoreURL: 'http://4.3.2.1/'};
    });

    afterEach(() => {
      window.juju_config = jujuConfig;
    });

    it('returns local default bundle icon location for bundles', function() {
      var path = utils.getIconPath('bundle:elasticsearch', true);
      assert.equal(
        path,
        'static/gui/build/app/assets/images/non-sprites/bundle.svg');
    });

    it('uses staticURL if provided for bundle icon location', function() {
      window.juju_config = {
        staticURL: 'static'
      };
      var path = utils.getIconPath('bundle:elasticsearch', true);
      assert.equal(
        path,
        'static/static/gui/build/app/assets/images/non-sprites/bundle.svg');
    });

    it('returns a qualified charmstoreURL icon location', function() {
      var path = utils.getIconPath('~paulgear/precise/quassel-core-2');
      assert.equal(
        path,
        'http://4.3.2.1/v5/~paulgear/precise/quassel-core-2/icon.svg');
    });

    it('handles charmstoreURL with no trailing slash', function() {
      window.juju_config = {charmstoreURL: 'http://4.3.2.1'};
      var path = utils.getIconPath('~paulgear/precise/quassel-core-2');
      assert.equal(
        path,
        'http://4.3.2.1/v5/~paulgear/precise/quassel-core-2/icon.svg');
    });
  });

  describe('isRedirectError', function() {
    it('returns true if it is a redirect error', function() {
      assert.equal(
        utils.isRedirectError('authentication failed: redirection required'),
        true);
    });

    it('returns false if it is not a redirect error', function() {
      assert.equal(
        utils.isRedirectError('it broke'),
        false);
    });
  });

  describe('isValue', function() {
    it('can check a value is set and not null', function() {
      assert.equal(utils.isValue('string'), true);
      assert.equal(utils.isValue(''), true);
      assert.equal(utils.isValue(1), true);
      assert.equal(utils.isValue(0), true);
      assert.equal(utils.isValue({key: 'value'}), true);
      assert.equal(utils.isValue({}), true);
      assert.equal(utils.isValue(['array']), true);
      assert.equal(utils.isValue([]), true);
      assert.equal(utils.isValue(undefined), false);
      assert.equal(utils.isValue(null), false);
    });
  });

  describe('isObject', function() {
    it('can check a value is an object', function() {
      assert.equal(utils.isObject({key: 'value'}), true);
      assert.equal(utils.isObject({}), true);
      assert.equal(utils.isObject([]), false);
      assert.equal(utils.isObject(undefined), false);
      assert.equal(utils.isObject(null), false);
    });
  });

  describe('arrayDedupe', function() {
    it('can remove duplicates from an array', function() {
      assert.deepEqual(
        utils.arrayDedupe(
          ['one', 'four', 'one', 'two', 'three', 'two', 'four']),
        ['one', 'four', 'two', 'three']);
    });
  });

  describe('arrayFlatten', function() {
    it('can flatten an array of arrays', function() {
      assert.deepEqual(
        utils.arrayFlatten(
          [['one', 'two'], ['three'], 'four']),
        ['one', 'two', 'three', 'four']);
    });

    it('can flatten nested arrays', function() {
      assert.deepEqual(
        utils.arrayFlatten(
          [[['one', 'two'], ['three']]]),
        ['one', 'two', 'three']);
    });
  });

  describe('formatConstraints', function() {
    it('can format constraints', function() {
      assert.equal(
        utils.formatConstraints({
          arch: 'amd64',
          cpuCores: 2,
          cpuPower: 10,
          disk: 2048,
          mem: 1024
        }),
        'arch=amd64 cpuCores=2 cpuPower=10 disk=2048 mem=1024');
    });
  });
})();
