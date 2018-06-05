/* Copyright (C) 2016 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('jujulib utility functions', () => {
  const wrap = window.jujulib._wrap;

  describe('_wrap', () => {
    it('returns a wrapped version of the supplied function', () => {
      const stub = sinon.stub();
      const wrapped = wrap(stub);
      assert.equal(typeof wrapped, 'function');
      assert.notEqual(stub, wrapped);
    });

    const of = 'calls the original function';

    it(of + 'with error', () => {
      const stub = sinon.stub();
      wrap(stub)('error');
      assert.deepEqual(stub.args, [['error', null]]);
    });

    it(of + 'without response text', () => {
      const stub = sinon.stub();
      wrap(stub)(null, {});
      assert.deepEqual(stub.args, [[null, null]]);
    });

    it(of + 'without json parsed response', () => {
      const stub = sinon.stub();
      wrap(stub)(null, {target: {responseText: '{"data": "data"}'}});
      assert.deepEqual(stub.args, [[null, '{"data": "data"}']]);
    });

    it(of + 'with json parsed response', () => {
      const stub = sinon.stub();
      wrap(stub, {parseJSON: true})(
        null, {target: {responseText: '{"data": "data"}'}});
      assert.deepEqual(stub.args, [[null, {data: 'data'}]]);
    });

    it(of + 'when json parsing fails', () => {
      const stub = sinon.stub();
      wrap(stub, {parseJSON: true})(
        null, {target: {responseText: '{"invalid "json}'}});
      assert.equal(
        stub.args[0][0],
        'SyntaxError: Unexpected token j in JSON at position 11');
      assert.equal(stub.args[0][1], null);
    });
  });


  describe('serializeObject', () => {
    it('serializes an object', () => {
      assert.equal(
        window.jujulib.serializeObject({
          'foo': 'bar',
          'baz': 'qux'
        }),
        'foo=bar&baz=qux');
    });

    it('serializes an empty object', () => {
      assert.equal(
        window.jujulib.serializeObject({}),
        '');
    });
  });

  describe('_transformAuthObject', () => {
    const transform = window.jujulib._transformAuthObject;
    it('calls supplied callback if error', () => {
      const stub = sinon.stub();
      transform(stub, 'error', 'data');
      assert.deepEqual(stub.args, [['error', 'data']]);
    });

    it('calls the supplied callback if no data', () => {
      const cb = sinon.stub();
      transform(cb, null, null);
      assert.deepEqual(cb.args[0], [null, null]);
    });

    it('lowercases data keys and calls supplied callback', () => {
      const stub = sinon.stub();
      transform(stub, null, {Upper: 'case', Keys: 'here'});
      assert.deepEqual(stub.args, [[null, {upper: 'case', keys: 'here'}]]);
    });
  });

});
