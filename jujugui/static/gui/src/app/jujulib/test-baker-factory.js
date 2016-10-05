/* Copyright (C) 2016 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('jujulib bakery factory', function() {

  var fakeBakery = function(cfg) {
    this.serviceName = cfg.serviceName;
  };

  fakeBakery.prototype.clearCookie = sinon.stub();

  it('exists', function() {
    const factory = new window.jujulib.bakeryFactory(fakeBakery);
    assert.strictEqual(factory instanceof window.jujulib.bakeryFactory, true);
  });

  it('can create a bakery', function() {
    const factory = new window.jujulib.bakeryFactory(fakeBakery);
    factory.create({serviceName: 'foo'});
    assert.strictEqual(factory._bakeries.has('foo'), true);
  });

  it('can get a bakery', function() {
    const factory = new window.jujulib.bakeryFactory(fakeBakery);
    factory.create({serviceName: 'foo'});
    factory.create({serviceName: 'bar'});
    factory.create({serviceName: 'baz'});
    let bakery = factory.get('bar');
    assert.equal(bakery.serviceName, 'bar');
  });

  it('can clear the cookies for a bakery', function() {
    const factory = new window.jujulib.bakeryFactory(fakeBakery);
    factory.create({serviceName: 'foo'});
    factory.create({serviceName: 'bar'});
    factory.clearAllCookies();
    assert.strictEqual(factory._bakeries.get('foo').clearCookie.called, true);
    assert.strictEqual(factory._bakeries.get('bar').clearCookie.called, true);
  });
});
