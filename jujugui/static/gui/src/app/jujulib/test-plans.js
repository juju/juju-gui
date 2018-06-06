/* Copyright (C) 2016 Canonical Ltd. */

'use strict';

const plans = require('./plans');

describe('jujulib plans service', function() {

  const makeXHRRequest = function(obj) {
    return {target: {responseText: JSON.stringify(obj)}};
  };

  it('exists', function() {
    const bakery = {};
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    assert.strictEqual(plansInstance instanceof plans.plans, true);
    assert.strictEqual(
      plansInstance.url, 'http://1.2.3.4/' + plans.plansAPIVersion);
  });

  it('is smart enough to handle missing trailing slash in URL', function() {
    const bakery = {};
    const plansInstance = new plans.plans('http://1.2.3.4', bakery);
    assert.strictEqual(
      plansInstance.url, 'http://1.2.3.4/' + plans.plansAPIVersion);
  });

  it('lists plans for a charm', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/charm?charm-url=cs:juju-gui-42');
        const xhr = makeXHRRequest([{
          url: 'canonical-landscape/24-7',
          plan: '1',
          'created-on': '2016-06-09T22:07:24Z',
          description: 'Delivers the highest level of support.',
          model: {
            metrics: 'metric'
          },
          price: 'the/price'
        }, {
          url: 'canonical-landscape/8-5',
          plan: 'B',
          'created-on': '2016-06-09T22:07:24Z',
          description: 'Offers a high level of support.',
          model: {
            metrics: 'metric'
          },
          price: 'the/price'
        }, {
          url: 'canonical-landscape/free',
          plan: '9 from outer space',
          'created-on': '2015-06-09T22:07:24Z',
          description: 'No support available.',
          model: {
            metrics: 'metric'
          },
          price: 'Free'
        }]);
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.listPlansForCharm('cs:juju-gui-42', function(error, plans) {
      assert.isNull(error);
      assert.deepEqual(plans, [{
        url: 'canonical-landscape/24-7',
        yaml: '1',
        createdAt: new Date(1465510044000),
        description: 'Delivers the highest level of support.',
        metrics: 'metric',
        price: 'the/price'
      }, {
        url: 'canonical-landscape/8-5',
        yaml: 'B',
        createdAt: new Date(1465510044000),
        description: 'Offers a high level of support.',
        metrics: 'metric',
        price: 'the/price'
      }, {
        url: 'canonical-landscape/free',
        yaml: '9 from outer space',
        createdAt: new Date(1433887644000),
        description: 'No support available.',
        metrics: 'metric',
        price: 'Free'
      }]);
      done();
    });
  });

  it('adds the charm schema prefix when listing plans', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/charm?charm-url=cs:django');
        const xhr = makeXHRRequest([]);
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.listPlansForCharm('django', function(error, plans) {
      assert.isNull(error);
      done();
    });
  });

  it('handles missing plans', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        const xhr = makeXHRRequest([]);
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.listPlansForCharm('cs:juju-gui/42', function(error, plans) {
      assert.isNull(error);
      assert.deepEqual(plans, []);
      done();
    });
  });

  it('handles errors listing plans', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        const xhr = makeXHRRequest({error: 'bad wolf'});
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.listPlansForCharm('django', function(error, plans) {
      assert.equal(error, 'bad wolf');
      assert.isNull(plans);
      done();
    });
  });

  it('retrieves the active plan for a given model and app', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/plan/model/uuid/service/app-name');
        const xhr = makeXHRRequest({
          'current-plan': 'canonical-landscape/free',
          'available-plans': {
            'canonical-landscape/8-5': {
              url: 'canonical-landscape/8-5',
              plan: 'B',
              'created-on': '2016-06-09T22:07:24Z',
              description: 'Offers a high level of support.',
              model: {
                metrics: 'metric'
              },
              price: 'the/price'
            },
            'canonical-landscape/free': {
              url: 'canonical-landscape/free',
              plan: '9 from outer space',
              'created-on': '2015-06-09T22:07:24Z',
              description: 'No support available.',
              model: {
                metrics: 'metric'
              },
              price: 'Free'
            }
          }
        });
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.showActivePlan('uuid', 'app-name', function(error, current, all) {
      assert.isNull(error);
      assert.deepEqual(current, {
        url: 'canonical-landscape/free',
        yaml: '9 from outer space',
        createdAt: new Date(1433887644000),
        description: 'No support available.',
        metrics: 'metric',
        price: 'Free'
      });
      assert.deepEqual(all, [{
        url: 'canonical-landscape/8-5',
        yaml: 'B',
        createdAt: new Date(1465510044000),
        description: 'Offers a high level of support.',
        metrics: 'metric',
        price: 'the/price'
      }, {
        url: 'canonical-landscape/free',
        yaml: '9 from outer space',
        createdAt: new Date(1433887644000),
        description: 'No support available.',
        metrics: 'metric',
        price: 'Free'
      }]);
      done();
    });
  });

  it('does not request active plans if no modelUUID is provided', function() {
    const bakery = {
      get: function(url, headers, callback) {
        assert.fail('request should not have been made');
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.showActivePlan(undefined, 'app-name', () => {});
  });

  it('handles errors retrieving the currently active plan', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        const xhr = makeXHRRequest({error: 'bad wolf'});
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.showActivePlan('uuid', 'app-name', function(error, current, all) {
      assert.equal(error, 'bad wolf');
      assert.isNull(current);
      assert.deepEqual(all, []);
      done();
    });
  });

  it('handles authorizing a plan', function(done) {
    const bakery = {
      post: function(url, headers, body, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/plan/authorize');
        const xhr = makeXHRRequest({
          'look ma': 'I\'m a macaroon',
          'params': body
        });
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.authorizePlan(
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
    const budgets = {
      'budgets': [{
        'owner': 'spinach',
        'budget': 'my-budget',
        'limit': 99,
        'allocated': 77,
        'unallocated': 22,
        'available': 22,
        'consumed': 55
      }],
      'total': {
        'limit': 999,
        'allocated': 777,
        'unallocated': 222,
        'consumed': 55,
        'available': 22
      }};
    const bakery = {
      get: function(url, headers, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/budget');
        const xhr = makeXHRRequest(budgets);
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.listBudgets(function(error, data) {
      assert.isNull(error);
      assert.deepEqual(data, budgets);
      done();
    });
  });

  it('handles errors listing budgets', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        const xhr = makeXHRRequest({error: 'bad wolf'});
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.listBudgets(function(error, data) {
      assert.equal(error, 'bad wolf');
      assert.isNull(data);
      done();
    });
  });

  it('handles adding a budget', function(done) {
    const bakery = {
      post: function(url, headers, body, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/budget');
        const xhr = makeXHRRequest({
          'auth': 'I\'m a macaroon',
          'params': body
        });
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.createBudget(
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
    const bakery = {
      post: function(url, headers, body, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/budget');
        const xhr = makeXHRRequest({error: 'bad wolf'});
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.createBudget(
      'budget',
      'limit',
      function(error, data) {
        assert.equal(error, 'bad wolf');
        done();
      }
    );
  });

  it('requests to update a budget', function(done) {
    const bakery = {
      patch: function(url, headers, body, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/budget/budgetid');
        assert.equal(body, '{"limit":"limit"}');
        const xhr = makeXHRRequest({ data: 'data' });
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.updateBudget(
      'budgetid',
      'limit',
      function(error, data) {
        assert.strictEqual(error, null);
        assert.deepEqual(data, {data: 'data'});
        done();
      }
    );
  });

  it('requests to remove a budget', function(done) {
    const bakery = {
      delete: function(url, headers, body, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/budget/budgetid');
        const xhr = makeXHRRequest({ data: 'data' });
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.removeBudget(
      'budgetid',
      function(error, data) {
        assert.strictEqual(error, null);
        assert.deepEqual(data, {data: 'data'});
        done();
      }
    );
  });

  it('requests to create an allocation', function(done) {
    const bakery = {
      post: function(url, headers, body, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/budget/budgetid/allocation');
        assert.deepEqual(body,
          '{"services":["application"],"model":"model","limit":"limit"}');
        const xhr = makeXHRRequest({ data: 'data' });
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.createAllocation(
      'budgetid',
      'application',
      'model',
      'limit',
      function(error, data) {
        assert.strictEqual(error, null);
        assert.deepEqual(data, {data: 'data'});
        done();
      }
    );
  });

  it('requests to update allocations', function(done) {
    const bakery = {
      patch: function(url, headers, body, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/model/model/service/application/allocation');
        assert.deepEqual(body, '{"limit":"limit"}');
        const xhr = makeXHRRequest({ data: 'data' });
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.updateAllocation(
      'model',
      'application',
      'limit',
      function(error, data) {
        assert.strictEqual(error, null);
        assert.deepEqual(data, {data: 'data'});
        done();
      }
    );
  });

  it('requests to remove allocations', function(done) {
    const bakery = {
      delete: function(url, headers, body, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/environment/model/service/application/allocation');
        const xhr = makeXHRRequest({ data: 'data' });
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.removeAllocation(
      'application',
      'model',
      function(error, data) {
        assert.strictEqual(error, null);
        assert.deepEqual(data, {data: 'data'});
        done();
      }
    );
  });

  it('requests to update credit limits', function(done) {
    const bakery = {
      patch: function(url, headers, body, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/profile/user');
        assert.deepEqual(body, '{"update":{"limit":"limit"}}');
        const xhr = makeXHRRequest({ data: 'data' });
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.updateCreditLimit(
      'user',
      'limit',
      function(error, data) {
        assert.strictEqual(error, null);
        assert.deepEqual(data, {data: 'data'});
        done();
      }
    );
  });

  it('requests to update default budget', function(done) {
    const bakery = {
      patch: function(url, headers, body, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/profile');
        assert.deepEqual(body,
          '{"update":{"default-budget":"defaultBudget"}}');
        const xhr = makeXHRRequest({ data: 'data' });
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.updateDefaultBudget(
      'defaultBudget',
      function(error, data) {
        assert.strictEqual(error, null);
        assert.deepEqual(data, {data: 'data'});
        done();
      }
    );
  });

  it('gets budget details', function(done) {
    const budget = {
      'limit': 'budget limit',
      'total': {
        'allocated': 'total allocated amount',
        'available': 'unconsumed amount',
        'unallocated': 'unallocated amount',
        'usage': 'percentage of budget consumed',
        'consumed': 'total consumed amount'
      },
      'allocations': [{
        'owner': 'user, creator of allocation',
        'consumed': 'amount consumed',
        'limit': 'allocation limit',
        'usage': 'consumed/limit',
        'model': 'model uuid',
        'services': {
          'service name': {
            'consumed': 'consumed',
            'usage': 'consumed/allocation limit'
          }
        }
      }]
    };
    const bakery = {
      get: function(url, headers, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/budget/my-budget');
        const xhr = makeXHRRequest(budget);
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.showBudget('my-budget', function(error, data) {
      assert.isNull(error);
      assert.deepEqual(data, budget);
      done();
    });
  });

  it('handles errors listing budgets', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        const xhr = makeXHRRequest({error: 'bad wolf'});
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.showBudget('my-budget', function(error, data) {
      assert.equal(error, 'bad wolf');
      assert.isNull(data);
      done();
    });
  });

  it('handles adding a profile', function(done) {
    const bakery = {
      post: function(url, headers, body, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/profile');
        const xhr = makeXHRRequest({
          'auth': 'I\'m a macaroon',
          'response': 'profile saved'
        });
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.createProfile(
      'user',
      'limit',
      'default-budget',
      'default-budget-limit',
      function(error, data) {
        assert.isNull(error);
        assert.equal(data['auth'], 'I\'m a macaroon');
        assert.equal(data.response, 'profile saved');
        done();
      }
    );
  });

  it('handles errors when adding a budget', function(done) {
    const bakery = {
      post: function(url, headers, body, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/profile');
        const xhr = makeXHRRequest({error: 'bad wolf'});
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.createProfile(
      'user',
      'limit',
      'default-budget',
      'default-budget-limit',
      function(error, data) {
        assert.equal(error, 'bad wolf');
        done();
      }
    );
  });

  it('gets kpi metrics for a charm', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        assert.equal(url, 'http://1.2.3.4/' +
          plans.plansAPIVersion +
          '/metrics/kpi?charm-url=cs%3Ajuju-gui-42');
        const xhr = makeXHRRequest([{
          Metric: 'metric',
          Time: 't',
          Sum: 42,
          Count: 5,
          Min: 'min',
          Max: 'max'
        }, {
          Metric: 'bad-wolf',
          Time: 't',
          Sum: 53,
          Count: 8,
          Min: 'min',
          Max: 'max'
        }, {
          Metric: 'metric',
          Time: 't',
          Sum: 80,
          Count: 10,
          Min: 'min',
          Max: 'max'
        }]);
        callback(null, xhr);
      }
    };
    const plansInstance = new plans.plans('http://1.2.3.4/', bakery);
    plansInstance.getKpiMetrics('cs:juju-gui-42', {}, function(error, metrics) {
      assert.isNull(error);
      assert.deepEqual(metrics, [{
        metric: 'metric',
        time: 't',
        sum: 42,
        count: 5,
        min: 'min',
        max: 'max'
      }, {
        metric: 'bad-wolf',
        time: 't',
        sum: 53,
        count: 8,
        min: 'min',
        max: 'max'
      }, {
        metric: 'metric',
        time: 't',
        sum: 80,
        count: 10,
        min: 'min',
        max: 'max'
      }]);
      done();
    });
  });
});
