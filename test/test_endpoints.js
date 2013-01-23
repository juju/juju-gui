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


describe('Relation endpoints logic', function() {
  var Y, juju, db, models;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'io', 'json-parse', 'array-extras'], function(Y) {
      function loadFixture(url) {
        return Y.JSON.parse(Y.io(url, {sync: true}).responseText);
      }
      sample_env = loadFixture('data/large_stream.json');
      sample_endpoints = loadFixture('data/large_endpoints.json');
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
      db.on_delta({data: {'op': 'delta', result: sample_env}});
      done();
    });
  });

  afterEach(function(done) {
    db.destroy();
    done();
  });

  it('should be able to find relatable services', function() {
    var service = db.services.getById('blog-lb'),
        available_svcs = Y.Object.keys(models.getEndpoints(
            service, sample_endpoints, db));
    available_svcs.sort();
    available_svcs.should.eql(
        ['mediawiki', 'puppet', 'rsyslog-forwarder', 'wiki-lb', 'wordpress']);
  });

  it('should find valid targets including subordinates', function() {
    var service = db.services.getById('memcached'),
        available = models.getEndpoints(service, sample_endpoints, db),
        available_svcs;
    available_svcs = Y.Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(
        ['puppet', 'rsyslog-forwarder', 'wordpress']);
  });

  it('should find ambigious targets', function() {
    // Mysql already has both subordinates related.
    var service = db.services.getById('mysql'),
        available = models.getEndpoints(service, sample_endpoints, db),
        available_svcs = Y.Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(['mediawiki']);
    // mediawiki has two possible relations (read slave or write master)
    // it can establish with mysql.
    available.mediawiki.should.eql([
      [{name: 'db', service: 'mysql', type: 'mysql'},
       {name: 'slave', service: 'mediawiki', type: 'mysql'}],
      [{name: 'db', service: 'mysql', type: 'mysql'},
       {name: 'db', service: 'mediawiki', type: 'mysql'}]
    ]);

    // Demonstrate the inverse retrieval of the same.
    available = models.getEndpoints(
        db.services.getById('mediawiki'), sample_endpoints, db),
    available.mysql.should.eql([
      [{name: 'slave', service: 'mediawiki', type: 'mysql'},
       {name: 'db', service: 'mysql', type: 'mysql'}],
      [{name: 'db', service: 'mediawiki', type: 'mysql'},
       {name: 'db', service: 'mysql', type: 'mysql'}]
    ]);
  });

  it('should find valid targets for a requires', function() {
    // Wordpress already has one subordinates related (puppet)
    // ..the picture is wrong.. wordpress only has one subordinate
    var service = db.services.getById('wordpress'),
        available = models.getEndpoints(service, sample_endpoints, db),
        available_svcs = Y.Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(
        ['blog-lb', 'memcached', 'rsyslog-forwarder']);
  });

  it('should find valid targets for subordinates', function() {
    var service = db.services.getById('puppet');
    var available = models.getEndpoints(service, sample_endpoints, db);
    var available_svcs = Y.Object.keys(available);

    available_svcs.sort();
    available_svcs.should.eql(
        ['blog-lb', 'memcached', 'puppetmaster', 'rsyslog', 'wiki-lb']);

    service = db.services.getById('rsyslog-forwarder');
    available = models.getEndpoints(service, sample_endpoints, db);
    available_svcs = Y.Object.keys(available);

    available_svcs.sort();
    available_svcs.should.eql(
        ['blog-lb', 'memcached',
         'puppetmaster', 'rsyslog', 'wiki-lb', 'wordpress']);
  });

});


