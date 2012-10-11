'use strict';


var default_env = {
  'result': [
    ['service', 'add',
     {'charm': 'cs:precise/wordpress-6',
       'id': 'blog', 'exposed': false}],
    ['service', 'add', {'charm': 'cs:precise/mysql-6',
       'id': 'my_db'}]],
  'op': 'delta'};

var default_endpoints = {
  'blog': {
    'requires': [
      {
        'interface': 'varnish',
        'optional': true,
        'limit': 2,
        'name': 'cache',
        'scope': 'global'
      },
      {
        'interface': 'mysql',
        'optional': false,
        'limit': 1,
        'name': 'db',
        'scope': 'global'
      }
    ],
    'provides': [
      {
        'interface': 'http',
        'optional': false,
        'limit': null,
        'name': 'url',
        'scope': 'global'
      }
    ]
  },
  'my_db': {
    'requires': [],
    'provides': [
      {
        'interface': 'mysql',
        'optional': false,
        'limit': null,
        'name': 'server',
        'scope': 'global'
      }
    ]
  }
};


// These are nominally based on improv sample.json delta stream with
// the addition of puppet subordinate relations.
var sample_endpoints,
    sample_env;


describe('Relation mapping logic', function() {
  var Y, juju, db, models;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['io', 'json-parse'], function(Y) {
      sample_env = loadFixture('sample_env.json');
      sample_endpoints = loadFixture('sample_endpoints.json');
      done();
    });
  });

  beforeEach(function(done) {
    Y = YUI(GlobalConfig).use(['juju-models',    
                               'juju-tests-utils',
                               'juju-controllers'],
    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      db = new (Y.namespace('juju.models')).Database();
      db.on_delta({data: default_env});
      done();
    });
  });

  function loadFixture(url) {
    return Y.JSON.parse(Y.io(url, {sync: true}).responseText);
  }

  afterEach(function(done) {
    db.destroy();
    done();
  });

  function loadFixture(url) {
    return Y.JSON.parse(Y.io(url, {sync: true}).responseText);
  }

  it('should be able find relatable services', function() {
    var service = db.services.getById('blog'),
        available = Y.Object.keys(models.getEndpoints(
            service, default_endpoints, db));

    available[0].should.equal('my_db');
    available.length.should.equal(1);

    service = db.services.getById('my_db');
    // Lookup by Value
    available = Y.Array.flatten(Y.Object.values(
        models.getEndpoints(service, default_endpoints, db)));
    available[0].service.should.equal('blog');
    available.length.should.equal(1);
  });

  it('should be able to find valid targets', function() {
    // populate with some sample relations
    db.reset();
    db.on_delta({data: {'op': 'delta', result: sample_env}});
    var service = db.services.getById('haproxy'),
        available = models.getEndpoints(service, sample_endpoints, db),
        available_svcs;
    available_svcs = Y.Object.keys(available);
    available_svcs.length.should.equal(2);
    available_svcs[0].should.equal('mediawiki');
    available_svcs[1].should.equal('wordpress');

    service = db.services.getById('puppet'),
    available = models.getEndpoints(service, sample_endpoints, db),
    available_svcs = Y.Object.keys(available);
    Y.Array.each(available, function(ep) {available_svcs.push(ep.service);});
    available_svcs.should.eql(
        ['mediawiki', 'mysql', 'wordpress', 'memcached']);
  });

  it('should be able find ignore existing relations services', function() {
    var blog = db.services.getById('blog'),
        endpoints = Y.Object.keys(
            models.getEndpoints(blog, default_endpoints, db));

    // Validate service level mappings
    endpoints[0].should.equal('my_db');

    // Force a relation delta
    db.on_delta({data: {
      result: [[
        'relation', 'add',
        {'interface': 'mysql',
          'scope': 'global', 'endpoints':
              [['my_db', {'role': 'server', 'name': 'db'}],
               ['blog', {'role': 'client', 'name': 'db'}]],
          'id': 'relation-0000000001'}]],
      op: 'delta'
    }});

    // Which means no valid endpoints.
    endpoints = Y.Object.keys(
        models.getEndpoints(blog, default_endpoints, db));
    endpoints.length.should.equal(0);
  });


});


