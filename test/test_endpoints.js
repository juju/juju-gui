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

var sample_endpoints = {"haproxy":{"requires":[{"interface":"http","limit":1,"optional":false,"name":"reverseproxy","scope":"global"}],"provides":[{"interface":"munin-node","limit":null,"optional":false,"name":"munin","scope":"global"},{"interface":"http","limit":null,"optional":false,"name":"website","scope":"global"}]},"mediawiki":{"requires":[{"interface":"mysql","limit":1,"optional":false,"name":"slave","scope":"global"},{"interface":"memcache","limit":1,"optional":false,"name":"cache","scope":"global"},{"interface":"mysql","limit":1,"optional":false,"name":"db","scope":"global"}],"provides":[{"interface":"http","limit":null,"optional":false,"name":"website","scope":"global"}]},"puppet":{"requires":[{"interface":"puppet","limit":1,"optional":false,"name":"puppetmaster","scope":"global"},{"interface":"juju-info","limit":1,"optional":false,"name":"juju-info","scope":"container"}],"provides":[]},"mysql":{"requires":[{"interface":"mysql-oneway-replication","limit":1,"optional":false,"name":"slave","scope":"global"}],"provides":[{"interface":"munin-node","limit":null,"optional":false,"name":"munin","scope":"global"},{"interface":"mysql","limit":null,"optional":false,"name":"db","scope":"global"},{"interface":"mysql-oneway-replication","limit":null,"optional":false,"name":"master","scope":"global"},{"interface":"mysql-shared","limit":null,"optional":false,"name":"shared-db","scope":"global"},{"interface":"local-monitors","limit":null,"optional":false,"name":"local-monitors","scope":"container"},{"interface":"mysql-root","limit":null,"optional":false,"name":"db-admin","scope":"global"},{"interface":"monitors","limit":null,"optional":false,"name":"monitors","scope":"global"}]},"wordpress":{"requires":[{"interface":"mount","limit":1,"optional":false,"name":"nfs","scope":"global"},{"interface":"memcache","limit":1,"optional":false,"name":"cache","scope":"global"},{"interface":"mysql","limit":1,"optional":false,"name":"db","scope":"global"}],"provides":[{"interface":"http","limit":null,"optional":false,"name":"website","scope":"global"}]},"memcached":{"requires":[],"provides":[{"interface":"munin-node","limit":null,"optional":false,"name":"munin","scope":"global"},{"interface":"memcache","limit":null,"optional":false,"name":"cache","scope":"global"}]}}


var sample_env = [
    ["service", "add", {"charm": "cs:precise/haproxy-7", "id": "haproxy"}], ["service", "add", {"charm": "cs:precise/mediawiki-3", "id": "mediawiki"}], ["service", "add", {"subordinate": true, "charm": "cs:precise/puppet-2", "id": "puppet"}], ["service", "add", {"charm": "cs:precise/mysql-6", "id": "mysql"}], ["service", "add", {"charm": "cs:precise/wordpress-7", "id": "wordpress"}], ["service", "add", {"charm": "cs:precise/memcached-1", "id": "memcached"}],
    ["relation", "add", {"interface": "mysql", "scope": "global", "endpoints": [["mysql", {"role": "server", "name": "db"}], ["mediawiki", {"role": "client", "name": "db"}]], "id": "relation-0000000002"}], ["relation", "add", {"interface": "memcache", "scope": "global", "endpoints": [["memcached", {"role": "server", "name": "cache"}], ["mediawiki", {"role": "client", "name": "cache"}]], "id": "relation-0000000003"}], ["relation", "add", {"interface": "mysql", "scope": "global", "endpoints": [["wordpress", {"role": "client", "name": "db"}], ["mysql", {"role": "server", "name": "db"}]], "id": "relation-0000000001"}], ["relation", "add", {"interface": "reversenginx", "scope": "global", "endpoints": [["wordpress", {"role": "peer", "name": "loadbalancer"}]], "id": "relation-0000000004"}], ["relation", "add", {"interface": "juju-info", "scope": "container", "endpoints": [["haproxy", {"role": "server", "name": "juju-info"}], ["puppet", {"role": "client", "name": "juju-info"}]], "id": "relation-0000000006"}]]


describe('Relation mapping logic', function() {
  var Y, juju, db, models;

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

  afterEach(function(done) {
    db.destroy();
    done();
  });

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
        ["mediawiki", "mysql", "wordpress", "memcached"]);
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


