/* Copyright (C) 2016 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('jujulib plans service', function() {

  var makeXHRRequest = function(obj) {
    return {target: {responseText: JSON.stringify(obj)}};
  };

  it('exists', function() {
    var bakery = {};
    var plans = new window.jujulib.plans('http://1.2.3.4/', bakery);
    assert.strictEqual(plans instanceof window.jujulib.plans, true);
    assert.strictEqual(
      plans.url, 'http://1.2.3.4/' + window.jujulib.plansAPIVersion);
  });

  it('is smart enough to handle missing trailing slash in URL', function() {
    var bakery = {};
    var plans = new window.jujulib.plans('http://1.2.3.4', bakery);
    assert.strictEqual(
      plans.url, 'http://1.2.3.4/' + window.jujulib.plansAPIVersion);
  });

  it('lists plans for a charm', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.plansAPIVersion +
          '/charm?charm-url=cs:juju-gui-42');
        var xhr = makeXHRRequest([{
          url: 'canonical-landscape/24-7',
          plan: '1',
          'created-on': '2016-06-09T22:07:24Z',
          description: 'Delivers the highest level of support.',
          price: 'the/price'
        }, {
          url: 'canonical-landscape/8-5',
          plan: 'B',
          'created-on': '2016-06-09T22:07:24Z',
          description: 'Offers a high level of support.',
          price: 'the/price'
        }, {
          url: 'canonical-landscape/free',
          plan: '9 from outer space',
          'created-on': '2015-06-09T22:07:24Z',
          description: 'No support available.',
          price: 'Free'
        }]);
        success(xhr);
      }
    };
    var plans = new window.jujulib.plans('http://1.2.3.4/', bakery);
    plans.listPlansForCharm('cs:juju-gui-42', function(error, plans) {
      assert.isNull(error);
      assert.deepEqual(plans, [{
        url: 'canonical-landscape/24-7',
        yaml: '1',
        createdAt: new Date(1465510044000),
        description: 'Delivers the highest level of support.',
        price: 'the/price'
      }, {
        url: 'canonical-landscape/8-5',
        yaml: 'B',
        createdAt: new Date(1465510044000),
        description: 'Offers a high level of support.',
        price: 'the/price'
      }, {
        url: 'canonical-landscape/free',
        yaml: '9 from outer space',
        createdAt: new Date(1433887644000),
        description: 'No support available.',
        price: 'Free'
      }]);
      done();
    });
  });

  it('adds the charm schema prefix when listing plans', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.plansAPIVersion +
          '/charm?charm-url=cs:django');
        var xhr = makeXHRRequest([]);
        success(xhr);
      }
    };
    var plans = new window.jujulib.plans('http://1.2.3.4/', bakery);
    plans.listPlansForCharm('django', function(error, plans) {
      assert.isNull(error);
      done();
    });
  });

  it('handles missing plans', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        var xhr = makeXHRRequest([]);
        success(xhr);
      }
    };
    var plans = new window.jujulib.plans('http://1.2.3.4/', bakery);
    plans.listPlansForCharm('cs:juju-gui/42', function(error, plans) {
      assert.isNull(error);
      assert.deepEqual(plans, []);
      done();
    });
  });

  it('handles errors listing plans', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        var xhr = makeXHRRequest({error: 'bad wolf'});
        failure(xhr);
      }
    };
    var plans = new window.jujulib.plans('http://1.2.3.4/', bakery);
    plans.listPlansForCharm('django', function(error, plans) {
      assert.equal(error, 'bad wolf');
      assert.isNull(plans);
      done();
    });
  });

  it('retrieves the active plan for a given model and app', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.plansAPIVersion +
          '/plan/model/uuid/service/app-name');
        var xhr = makeXHRRequest({
          'current-plan': 'canonical-landscape/free',
          'available-plans': {
            'canonical-landscape/8-5': {
              url: 'canonical-landscape/8-5',
              plan: 'B',
              'created-on': '2016-06-09T22:07:24Z',
              description: 'Offers a high level of support.',
              price: 'the/price'
            },
            'canonical-landscape/free': {
              url: 'canonical-landscape/free',
              plan: '9 from outer space',
              'created-on': '2015-06-09T22:07:24Z',
              description: 'No support available.',
              price: 'Free'
            }
          }
        });
        success(xhr);
      }
    };
    var plans = new window.jujulib.plans('http://1.2.3.4/', bakery);
    plans.showActivePlan('uuid', 'app-name', function(error, current, all) {
      assert.isNull(error);
      assert.deepEqual(current, {
        url: 'canonical-landscape/free',
        yaml: '9 from outer space',
        createdAt: new Date(1433887644000),
        description: 'No support available.',
        price: 'Free'
      });
      assert.deepEqual(all, [{
        url: 'canonical-landscape/8-5',
        yaml: 'B',
        createdAt: new Date(1465510044000),
        description: 'Offers a high level of support.',
        price: 'the/price'
      }, {
        url: 'canonical-landscape/free',
        yaml: '9 from outer space',
        createdAt: new Date(1433887644000),
        description: 'No support available.',
        price: 'Free'
      }]);
      done();
    });
  });

  it('handles errors retrieving the currently active plan', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        var xhr = makeXHRRequest({error: 'bad wolf'});
        failure(xhr);
      }
    };
    var plans = new window.jujulib.plans('http://1.2.3.4/', bakery);
    plans.showActivePlan('uuid', 'app-name', function(error, current, all) {
      assert.equal(error, 'bad wolf');
      assert.isNull(current);
      assert.deepEqual(all, []);
      done();
    });
  });

  it('handles authorizing a plan', function(done) {
    var bakery = {
      sendPostRequest: function(path, params, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.plansAPIVersion +
          '/plan/authorize');
        var xhr = makeXHRRequest({
          'look ma': 'I\'m a macaroon',
          'params': params
        });
        success(xhr);
      }
    };
    var plans = new window.jujulib.plans('http://1.2.3.4/', bakery);
    plans.authorizePlan(
      'envUUID',
      'charmUrl',
      'applicationName',
      'planUrl',
      'budget',
      'limit',
      function(error, authz) {
        assert.isNull(error);
        assert.equal(authz['look ma'], 'I\'m a macaroon');
        assert.equal(authz.params,
          '{"env-uuid":"envUUID","charm-url":"charmUrl",' +
          '"service-name":"applicationName","plan-url":"planUrl",' +
          '"budget":"budget","limit":"limit"}');
        done();
      }
    );
  });

  it('lists budgets', function(done) {
    var budgets = {
    'budgets': [{
      'owner': 'spinach',
      'budget': 'my-budget',
      'limit': 99,
      'allocated': 77,
      'unallocated': 22,
      'available': 22,
      'consumed': 55,
      }],
    'total': {
      'limit': 999,
      'allocated': 777,
      'unallocated': 222,
      'consumed': 55,
      'available': 22,
    }};
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.plansAPIVersion +
          '/budget');
        var xhr = makeXHRRequest(budgets);
        success(xhr);
      }
    };
    var plans = new window.jujulib.plans('http://1.2.3.4/', bakery);
    plans.getBudgets(function(error, data) {
      assert.isNull(error);
      assert.deepEqual(data, budgets);
      done();
    });
  });

  it('handles errors listing budgets', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        var xhr = makeXHRRequest({error: 'bad wolf'});
        failure(xhr);
      }
    };
    var plans = new window.jujulib.plans('http://1.2.3.4/', bakery);
    plans.getBudgets(function(error, data) {
      assert.equal(error, 'bad wolf');
      assert.isNull(data);
      done();
    });
  });

  it('handles adding a budget', function(done) {
    var bakery = {
      sendPostRequest: function(path, params, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.plansAPIVersion +
          '/budget');
        var xhr = makeXHRRequest({
          'auth': 'I\'m a macaroon',
          'params': params
        });
        success(xhr);
      }
    };
    var plans = new window.jujulib.plans('http://1.2.3.4/', bakery);
    plans.createBudget(
      'budget',
      'limit',
      function(error, data) {
        assert.isNull(error);
        assert.equal(data['auth'], 'I\'m a macaroon');
        assert.equal(data.params, '{"budget":"budget","limit":"limit"}');
        done();
      }
    );
  });

  it('handles errors when adding a budget', function(done) {
    var bakery = {
      sendPostRequest: function(path, params, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.plansAPIVersion +
          '/budget');
        var xhr = makeXHRRequest({error: 'bad wolf'});
        success(xhr);
      }
    };
    var plans = new window.jujulib.plans('http://1.2.3.4/', bakery);
    plans.createBudget(
      'budget',
      'limit',
      function(error, data) {
        assert.equal(error, 'bad wolf');
        done();
      }
    );
  });
});
