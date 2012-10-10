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


describe('Relation mapping logic', function() {
  var Y, juju, db, models;

  before(function(done) {
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

  after(function(done) {
    db.destroy();
    done();
  });

  it('should be able find relatable services', function() {
    var service = db.services.getById('blog'),
        available = models.getEndpoints(
            service, default_endpoints, db);
    available[0].service.should.equal('my_db');
    available.length.should.equal(1);

    service = db.services.getById('my_db');
    available = models.getEndpoints(service, default_endpoints, db);
    available[0].service.should.equal('blog');
    available.length.should.equal(1);
  });


  it('should be able find ignore existing relations services', function() {
    var blog = db.services.getById('blog'),
        endpoints = models.getEndpoints(blog, default_endpoints, db);

    // Validate service level mappings
    endpoints[0].service.should.equal('my_db');

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
    endpoints = models.getEndpoints(blog, default_endpoints, db);
    endpoints.length.should.equal(0);
  });


});


