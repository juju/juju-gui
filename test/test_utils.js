/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

(function() {
  describe('juju-views-utils', function() {
    var views, Y;
    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-view-utils', 'node-event-simulate',
          function(Y) {
            views = Y.namespace('juju.views');
            done();
          });
    });

    it('can generate a hash', function() {
      // We aren't testing the algorithm here, just basic hash characteristics.
      // It's a number.
      assert.strictEqual(views.utils.generateHash(''), 0);
      assert.isNumber(views.utils.generateHash('kumquat'));
      assert.isNumber(views.utils.generateHash('qumquat'));
      // It's stable.
      assert.strictEqual(
          views.utils.generateHash('kumquat'),
          views.utils.generateHash('kumquat'));
      // Different values hash differently.
      assert.notEqual(
          views.utils.generateHash('kumquat'),
          views.utils.generateHash('qumquat'));
    });

    it('can generate safe relation ids', function() {
      var relationId;
      relationId = 'foo:Bar relation-00000006!@#';
      assert.strictEqual(
          views.utils.generateSafeDOMId(relationId),
          'e-foo_Bar_relation_00000006___-' +
          views.utils.generateHash(relationId));
    });

    it('should create a confirmation panel',
       function() {
          var confirmed = false;
          var panel = views.createModalPanel(
              'Description',
              '#main',
              'Action Label',
              function() {confirmed = true;}
         );
          panel.show();
          var panel_node = panel.get('boundingBox'),
              button = panel_node.all('.button').item(0);
          button.getHTML().should.equal('Action Label');
          button.simulate('click');
          confirmed.should.equal(true);
          panel.destroy();
       });

    it('should hide the panel when the Cancel button is clicked',
       function() {
          var confirmed = false;
          var panel = views.createModalPanel(
              'Description',
              '#main',
              'Action Label',
              function() {confirmed = true;});
          panel.show();
          var panel_node = panel.get('boundingBox'),
              button = panel_node.all('.button').item(1);
          button.getHTML().should.equal('Cancel');
          button.simulate('click');
          confirmed.should.equal(false);
          panel.destroy();
       });

    it('should allow you to reset the buttons', function() {
      var confirmed = false;
      var panel = views.createModalPanel(
          'Description',
          '#main',
          'First Action Label',
          function() {confirmed = false;});
      panel.get('buttons').footer.length.should.equal(2);
      views.setModalButtons(
          panel, 'Second Action Label', function() { confirmed = true; });
      panel.get('buttons').footer.length.should.equal(2);
      panel.show();
      var panel_node = panel.get('boundingBox'),
              button = panel_node.all('.button').item(0);
      button.getHTML().should.equal('Second Action Label');
      button.simulate('click');
      confirmed.should.equal(true);
      panel.destroy();
    });

    describe('linkify', function() {
      it('should linkify urls', function() {
        assert.equal(
            views.utils.linkify('foo http://example.com/foo?x=1&y=2 bar'),
            'foo <a href="http://example.com/foo?x=1&y=2" target="_blank" ' +
            'class="break-word">' +
            'http:&#x2F;&#x2F;example.com&#x2F;foo?x=1&amp;y=2</a> bar');
      });

      it('should linkify Launchpad references', function() {
        assert.equal(
            views.utils.linkify('foo lp:~example/juju-gui/mine bar'),
            'foo <a href="https://code.launchpad.net/~example/juju-gui/mine" ' +
            'target="_blank" class="break-word">' +
            'lp:~example&#x2F;juju-gui&#x2F;mine</a> bar');
      });

      it('should wrap long words', function() {
        assert.equal(
            views.utils.linkify(
                'foo supecalifragilisticexpialidocious' +
                'antidisestablishmentarianism bar'),
            'foo <span class="break-word">' +
            'supecalifragilisticexpialidociousantidisestablishmentarianism' +
            '</span> bar');
      });

      it('should escape other content', function() {
        assert.equal(
            views.utils.linkify('foo <script>alert("hi");</script> bar'),
            'foo &lt;script&gt;alert(&quot;hi&quot;);&lt;&#x2F;script&gt; bar');
        // This variation is a bit of a whitebox test: make sure that strings
        // after matches are escaped also.  The "<bar>" at the end is the
        // important bit.
        assert.equal(
            views.utils.linkify('foo http://example.com/ <bar>'),
            'foo <a href="http://example.com/" target="_blank" ' +
            'class="break-word">' +
            'http:&#x2F;&#x2F;example.com&#x2F;</a> &lt;bar&gt;');
      });

      it('trims', function() {
        assert.equal(
            views.utils.linkify('  foo bar  '),
            'foo bar');
      });
    });

  });
}) ();

describe('utilities', function() {
  var Y, views, models, utils;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-views', 'juju-models'], function(Y) {
      views = Y.namespace('juju.views');
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju.views.utils');
      done();
    });
  });

  it('must be able to display humanize time ago messages', function() {
    var now = Y.Lang.now();
    // Javascript timestamps are in milliseconds
    views.humanizeTimestamp(now).should.equal('less than a minute ago');
    views.humanizeTimestamp(now + 600000).should.equal('10 minutes ago');
  });


  describe('getConstraints', function() {
    var customConstraints, genericConstraints,
        getConstraints, serviceConstraints, readOnlyConstraints;

    before(function() {
      getConstraints = utils.getConstraints;
      serviceConstraints = {arch: 'lcars', cpu: 'quantum', mem: 'teraflop'};
      customConstraints = {foo: 'bar', arch: 'amd64', mem: '1MB'};
      genericConstraints = ['cpu', 'mem', 'arch'];
      readOnlyConstraints = utils.readOnlyConstraints;
    });

    it('correctly returns constraints for a service', function() {
      var expected = [
        {name: 'cpu', value: 'quantum', title: 'CPU', unit: 'GHz'},
        {name: 'mem', value: 'teraflop', title: 'Memory', unit: 'MB'},
        {name: 'arch', value: 'lcars', title: 'Architecture'}
      ];
      var obtained = getConstraints(serviceConstraints, genericConstraints);
      // Read only constraints are now private so as long as
      // this check passes then it excludes them.
      assert.deepEqual(expected, obtained);
    });

    it('handles missing service constraints', function() {
      var expected = [
        {name: 'cpu', value: '', title: 'CPU', unit: 'GHz'},
        {name: 'mem', value: '', title: 'Memory', unit: 'MB'},
        {name: 'arch', value: '', title: 'Architecture'}
      ];
      var obtained = getConstraints({}, genericConstraints);
      assert.deepEqual(expected, obtained);
    });

    it('includes unexpected service constraints', function() {
      var expected = [
        {name: 'cpu', value: '', title: 'CPU', unit: 'GHz'},
        {name: 'mem', value: '1MB', title: 'Memory', unit: 'MB'},
        {name: 'arch', value: 'amd64', title: 'Architecture'},
        {name: 'foo', value: 'bar', title: 'foo'}
      ];
      var obtained = getConstraints(customConstraints, genericConstraints);
      assert.deepEqual(expected, obtained);
    });

  });


  describe('isPythonRelation', function() {
    var isPythonRelation;

    before(function() {
      isPythonRelation = utils.isPythonRelation;
    });

    it('identifies PyJuju relations', function() {
      var relations = ['relation-0000000002', 'relation-42', 'relation-0'];
      relations.forEach(function(relation) {
        assert.isTrue(isPythonRelation(relation), relation);
      });
    });

    it('identifies juju-core relations', function() {
      var relations = [
        'wordpress:loadbalancer',
        'haproxy:reverseproxy wordpress:website',
        'relation-0000000002:mysql'
      ];
      relations.forEach(function(relation) {
        assert.isFalse(isPythonRelation(relation), relation);
      });
    });

  });


  describe('relations visualization', function() {
    var db, service;

    beforeEach(function() {
      db = new models.Database();
      service = new models.Service({
        id: 'mysql',
        charm: 'cs:mysql',
        unit_count: 1,
        loaded: true
      });
      db.services.add(service);
    });

    it('shows a PyJuju rel from the perspective of a service', function() {
      db.relations.add({
        'interface': 'mysql',
        scope: 'global',
        endpoints: [
          ['mysql', {role: 'server', name: 'mydb'}],
          ['mediawiki', {role: 'client', name: 'db'}]
        ],
        'id': 'relation-0000000002'
      });
      var results = utils.getRelationDataForService(db, service);
      assert.strictEqual(1, results.length);
      var result = results[0];
      assert.strictEqual('mysql', result['interface'], 'interface');
      assert.strictEqual('global', result.scope, 'scope');
      assert.strictEqual('relation-0000000002', result.id, 'id');
      assert.strictEqual(
          utils.generateSafeDOMId('relation-0000000002'),
          result.elementId,
          'elementId'
      );
      assert.strictEqual('mydb:2', result.ident, 'ident');
      assert.strictEqual('mysql', result.near.service, 'near service');
      assert.strictEqual('server', result.near.role, 'near role');
      assert.strictEqual('mydb', result.near.name, 'near name');
      assert.strictEqual('mediawiki', result.far.service, 'far service');
      assert.strictEqual('client', result.far.role, 'far role');
      assert.strictEqual('db', result.far.name, 'far name');
    });

    it('shows a juju-core rel from the perspective of a service', function() {
      db.relations.add({
        'interface': 'mysql',
        scope: 'global',
        endpoints: [
          ['mysql', {role: 'provider', name: 'mydb'}],
          ['mediawiki', {role: 'requirer', name: 'db'}]
        ],
        'id': 'mediawiki:db mysql:mydb'
      });
      var results = utils.getRelationDataForService(db, service);
      assert.strictEqual(1, results.length);
      var result = results[0];
      assert.strictEqual('mysql', result['interface'], 'interface');
      assert.strictEqual('global', result.scope, 'scope');
      assert.strictEqual('mediawiki:db mysql:mydb', result.id, 'id');
      assert.strictEqual(
          utils.generateSafeDOMId('mediawiki:db mysql:mydb'),
          result.elementId,
          'elementId'
      );
      assert.strictEqual('mediawiki:db mysql:mydb', result.ident, 'ident');
      assert.strictEqual('mysql', result.near.service, 'near service');
      assert.strictEqual('provider', result.near.role, 'near role');
      assert.strictEqual('mydb', result.near.name, 'near name');
      assert.strictEqual('mediawiki', result.far.service, 'far service');
      assert.strictEqual('requirer', result.far.role, 'far role');
      assert.strictEqual('db', result.far.name, 'far name');
    });

  });

  describe('getChangedConfigOptions', function() {
    var getChangedConfigOptions;

    before(function() {
      getChangedConfigOptions = utils.getChangedConfigOptions;
    });

    it('returns undefined if no config options are provided', function() {
      assert.isUndefined(getChangedConfigOptions(null, {}));
    });

    it('returns an empty object if an empty config is provided', function() {
      var newValues = getChangedConfigOptions({}, {foo: 'bar'});
      assert.deepEqual(newValues, {});
    });

    it('returns an empty object if no service changes are found', function() {
      var newValues = getChangedConfigOptions({foo: 'bar'}, {foo: 'bar'});
      assert.deepEqual(newValues, {});
    });

    it('returns an empty object if no charm changes are found', function() {
      var charmConfig = {foo: {default: 'bar'}};
      var newValues = getChangedConfigOptions({foo: 'bar'}, charmConfig);
      assert.deepEqual(newValues, {});
    });

    it('returns changes if they are found on the service', function() {
      var serviceConfig = {
        key1: 'value1',
        key2: 'value2',
        key3: true,
        key4: false,
        key5: 5,
        key6: 6
      };
      var newConfig = {
        key1: 'value1',
        key2: 'CHANGED!',
        key3: true,
        key4: true,
        key5: 5,
        key6: 42
      };
      var newValues = getChangedConfigOptions(newConfig, serviceConfig);
      assert.deepEqual(newValues, {key2: 'CHANGED!', key4: true, key6: 42});
    });

    it('returns changes if they are found on the charm', function() {
      var charmConfig = {
        key1: {default: 'value1'},
        key2: {default: 'value2'},
        key3: {default: true},
        key4: {default: false},
        key5: {default: 5},
        key6: {default: 6}
      };
      var newConfig = {
        key1: 'value1',
        key2: 'CHANGED!',
        key3: true,
        key4: true,
        key5: 5,
        key6: 42
      };
      var newValues = getChangedConfigOptions(newConfig, charmConfig);
      assert.deepEqual(newValues, {key2: 'CHANGED!', key4: true, key6: 42});
    });

    it('returns all the changes if the existing config is empty', function() {
      var newValues = getChangedConfigOptions({key1: 'value', key2: 42}, {});
      assert.deepEqual(newValues, {key1: 'value', key2: 42});
    });

    it('does not modify in place the passed new config object', function() {
      var newConfig = {key1: 'CHANGED!', key2: 42};
      getChangedConfigOptions(newConfig, {key1: 'value', key2: 42});
      assert.deepEqual(newConfig, {key1: 'CHANGED!', key2: 42});
    });

    it('does not modify in place the passed existing config', function() {
      var serviceConfig = {key1: 'value', key2: 42};
      getChangedConfigOptions({key1: 'CHANGED!', key2: 42}, serviceConfig);
      assert.deepEqual(serviceConfig, {key1: 'value', key2: 42});
    });

  });

  describe('normalizeUnitPorts', function() {
    var normalizeUnitPorts;

    before(function() {
      normalizeUnitPorts = utils.normalizeUnitPorts;
    });

    it('normalizes juju-core ports', function() {
      var expected = [
        {port: 80, protocol: 'tcp'},
        {port: 42, protocol: 'udp'}
      ];
      var obtained = normalizeUnitPorts(['80/tcp', '42/udp']);
      assert.deepEqual(obtained, expected);
    });

    it('normalizes pyJuju ports', function() {
      var expected = [
        {port: 80, protocol: 'tcp'},
        {port: 443, protocol: 'tcp'},
        {port: 8080, protocol: 'tcp'}
      ];
      var obtained = normalizeUnitPorts([80, '443', 8080]);
      assert.deepEqual(obtained, expected);
    });

    it('returns an empty list if no ports are passed', function() {
      assert.deepEqual(normalizeUnitPorts([]), []);
      assert.deepEqual(normalizeUnitPorts(undefined), []);
    });

  });

  describe('parseUnitPorts', function() {
    var parseUnitPorts;

    before(function() {
      parseUnitPorts = utils.parseUnitPorts;
    });

    it('parses generic ports', function() {
      var expected = [
        {text: '10.0.3.1', href: undefined},
        [
          {text: '42/tcp', href: 'http://10.0.3.1:42/'},
          {text: '47/tcp', href: 'http://10.0.3.1:47/'}
        ]
      ];
      var ports = [{port: 42, protocol: 'tcp'}, {port: 47, protocol: 'tcp'}];
      assert.deepEqual(parseUnitPorts('10.0.3.1', ports), expected);
    });

    it('parses the HTTP port', function() {
      var expected = [
        {text: '10.0.3.1', href: 'http://10.0.3.1/'},
        [
          {text: '80/tcp', href: 'http://10.0.3.1/'},
          {text: '47/tcp', href: 'http://10.0.3.1:47/'}
        ]
      ];
      var ports = [{port: 80, protocol: 'tcp'}, {port: 47, protocol: 'tcp'}];
      assert.deepEqual(parseUnitPorts('10.0.3.1', ports), expected);
    });

    it('parses the HTTPS port', function() {
      var expected = [
        {text: '10.0.3.1', href: 'https://10.0.3.1/'},
        [
          {text: '42/tcp', href: 'http://10.0.3.1:42/'},
          {text: '443/tcp', href: 'https://10.0.3.1/'}
        ]
      ];
      var ports = [{port: 42, protocol: 'tcp'}, {port: 443, protocol: 'tcp'}];
      assert.deepEqual(parseUnitPorts('10.0.3.1', ports), expected);
    });

    it('privileges the HTTPS port', function() {
      var expected = [
        {text: '10.0.3.1', href: 'https://10.0.3.1/'},
        [
          {text: '42/tcp', href: 'http://10.0.3.1:42/'},
          {text: '443/tcp', href: 'https://10.0.3.1/'},
          {text: '80/tcp', href: 'http://10.0.3.1/'}
        ]
      ];
      var ports = [
        {port: 42, protocol: 'tcp'},
        {port: 443, protocol: 'tcp'},
        {port: 80, protocol: 'tcp'}
      ];
      assert.deepEqual(parseUnitPorts('10.0.3.1', ports), expected);
    });

    it('avoid linking UDP ports', function() {
      var expected = [
        {text: '10.0.3.1', href: 'https://10.0.3.1/'},
        [
          {text: '42/udp'},
          {text: '443/tcp', href: 'https://10.0.3.1/'}
        ]
      ];
      var ports = [
        {port: 42, protocol: 'udp'},
        {port: 443, protocol: 'tcp'}
      ];
      assert.deepEqual(parseUnitPorts('10.0.3.1', ports), expected);
    });

    it('handles no open ports', function() {
      var expected = [{text: '10.0.3.1', href: undefined}, []];
      assert.deepEqual(parseUnitPorts('10.0.3.1', []), expected);
    });

  });

});

(function() {
  describe('form validation', function() {

    var utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-views',

          function(Y) {
            utils = Y.namespace('juju.views.utils');
            done();
          });
    });

    it('should handle int fields', function() {
      var schema = {an_int: {type: 'int'}};

      // If an int field has a valid value, no error is given.
      assert.equal(utils.validate({an_int: '0'}, schema).an_int, undefined);
      // If an int field has an invalid value, an error is reported.
      assert.equal(utils.validate({an_int: 'nope!'}, schema).an_int,
          'The value "nope!" is not an integer.');
      // Floating point numbers are not valid ints.
      assert.equal(utils.validate({an_int: '3.14159'}, schema).an_int,
          'The value "3.14159" is not an integer.');
      // Just starting with a number is not enough.
      assert.equal(utils.validate({an_int: '3peat'}, schema).an_int,
          'The value "3peat" is not an integer.');

      assert.equal(utils.validate({an_int: ''}, schema).an_int,
          'This field is required.');
      assert.equal(utils.validate({an_int: '  '}, schema).an_int,
          'This field is required.');

      // Floating point numbers are not valid ints.
      assert.equal(utils.validate({an_int: '+'}, schema).an_int,
          'The value "+" is not an integer.');
      assert.equal(utils.validate({an_int: '+1'}, schema).an_int,
          undefined);
      assert.equal(utils.validate({an_int: ' +1 '}, schema).an_int,
          undefined);
      // Just starting with a number is not enough.
      assert.equal(utils.validate({an_int: '-'}, schema).an_int,
          'The value "-" is not an integer.');
      assert.equal(utils.validate({an_int: '-1'}, schema).an_int,
          undefined);
      assert.equal(utils.validate({an_int: ' -1 '}, schema).an_int,
          undefined);

    });

    it('should handle float fields', function() {
      var schema = {a_float: {type: 'float'}};

      // Floating point numbers are valid floats.
      assert.equal(utils.validate({a_float: '3.14159'}, schema).a_float,
          undefined);
      // Decimal points are not strictly required.
      assert.equal(utils.validate({a_float: '42'}, schema).a_float, undefined);

      // Test numbers with - + and spaces
      assert.equal(utils.validate({a_float: '-42'}, schema).a_float,
          undefined);
      assert.equal(utils.validate({a_float: '+42'}, schema).a_float,
          undefined);
      assert.equal(utils.validate({a_float: ' +42 '}, schema).a_float,
          undefined);

      // Digits before the decimal point are not strictly required.
      assert.equal(utils.validate({a_float: '.5'}, schema).a_float, undefined);

      // Test numbers with - + and spaces
      assert.equal(utils.validate({a_float: '-0.5'}, schema).a_float,
          undefined);
      assert.equal(utils.validate({a_float: '+0.5'}, schema).a_float,
          undefined);
      assert.equal(utils.validate({a_float: ' -0.5 '}, schema).a_float,
          undefined);

      // If a float field has an invalid value, an error is reported.
      assert.equal(utils.validate({a_float: 'nope!'}, schema).a_float,
          'The value "nope!" is not a float.');
      // Just starting with a number is not enough.
      assert.equal(utils.validate({a_float: '3peat'}, schema).a_float,
          'The value "3peat" is not a float.');

      assert.equal(utils.validate({a_float: ''}, schema).a_float,
          'This field is required.');
      assert.equal(utils.validate({a_float: '  '}, schema).a_float,
          'This field is required.');

      assert.equal(utils.validate({a_float: '+'}, schema).a_float,
          'The value "+" is not a float.');
      assert.equal(utils.validate({a_float: '-'}, schema).a_float,
          'The value "-" is not a float.');
      assert.equal(utils.validate({a_float: '.'}, schema).a_float,
          'The value "." is not a float.');
    });

    it('should handle fields with defaults', function() {
      var defaults_schema =
          { an_int:
                { type: 'int',
                  'default': '7'},
            a_float:
                { type: 'float',
                  'default': '2.5'},
            a_string:
                { type: 'string',
                  'default': 'default'}};

      // If a field has a default and it is a numeric field and the value is an
      // empty string, then no error is generated.

      // Int:
      assert.equal(utils.validate({an_int: ''}, defaults_schema).an_int,
          undefined);
      // Float:
      assert.equal(utils.validate({a_float: ''}, defaults_schema).a_float,
          undefined);
    });

    it('should handle fields without defaults', function() {
      var no_defaults_schema =
          { an_int:
                { type: 'int'},
            a_float:
                { type: 'float'},
            a_string:
                { type: 'string'}};

      // If a field has no default and it is a numeric field and the value is
      // an empty string, then an error is generated.

      // Int without default:
      assert.equal(utils.validate({an_int: ''}, no_defaults_schema).an_int,
          'This field is required.');
      // Float without default
      assert.equal(utils.validate({a_float: ''}, no_defaults_schema).a_float,
          'This field is required.');
      // String fields do not generate errors when they are empty and do not
      // have a default because an empty string is still a string.
      assert.equal(utils.validate({a_string: ''}, no_defaults_schema).a_string,
          undefined);
    });

  });
})();

(function() {
  describe('service state simplification', function() {

    var simplifyState, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-views', function(Y) {
        simplifyState = Y.namespace('juju.views.utils').simplifyState;
        done();
      });
    });

    var makeUnit = function(state, relationErrors) {
      var unit = {agent_state: state};
      if (relationErrors) {
        unit.relation_errors = {myrelation: ['service']};
      }
      return unit;
    };

    it('translates service running states correctly', function() {
      var unit = makeUnit('started');
      assert.strictEqual('running', simplifyState(unit));
    });

    it('returns "error" if there is a relation error', function() {
      var unit = makeUnit('started', true); // Add a relation error.
      assert.strictEqual('error', simplifyState(unit));
    });

    it('has the ability to ignore relation errors', function() {
      var unit = makeUnit('started', true); // Add a relation error.
      var result = simplifyState(unit, true); // Ignore relation errors.
      assert.strictEqual('running', result);
    });

    it('translates service error states correctly', function() {
      var states = ['install-error', 'foo-error', '-error', 'error'];
      states.forEach(function(state) {
        var unit = makeUnit(state);
        assert.strictEqual('error', simplifyState(unit), state);
      });
    });

    it('translates service pending states correctly', function() {
      var states = ['pending', 'installed', 'waiting', 'stopped'];
      states.forEach(function(state) {
        var unit = makeUnit(state);
        assert.strictEqual('pending', simplifyState(unit), state);
      });
    });

  });
})();

(function() {
  describe('state to style', function() {

    var utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-views', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('should translate unit states to styles correctly', function() {
      // The states 'installed', 'pending' and 'stopped' are turned
      // into 'state-pending'.
      assert.equal('state-pending', utils.stateToStyle('installed'));
      assert.equal('state-pending', utils.stateToStyle('pending'));
      assert.equal('state-pending', utils.stateToStyle('stopped'));
      // The state 'started' is turned into 'state-started'.
      assert.equal('state-started', utils.stateToStyle('started'));
      // The states 'install-error', 'start-error' and 'stop-error' are turned
      // into 'state-error'.
      assert.equal('state-error', utils.stateToStyle('install-error'));
      assert.equal('state-error', utils.stateToStyle('start-error'));
      assert.equal('state-error', utils.stateToStyle('stop-error'));
    });

    it('should add the computed class to the existing ones', function() {
      var classes = utils.stateToStyle('pending', 'existing');
      assert.include(classes, 'state-pending');
      assert.include(classes, 'existing');
    });

  });
})();

(function() {
  describe('utils.isGuiService', function() {

    var utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-views', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('should extract values from "charm" attribute', function() {
      var candidate = {charm: 'cs:precise/juju-gui-7'};
      assert.isTrue(utils.isGuiService(candidate));
    });

    it('should extract values from .get("charm")', function() {
      var candidate = {
        get: function(name) {
          if (name === 'charm') {
            return 'cs:precise/juju-gui-7';
          }
        }
      };
      assert.isTrue(utils.isGuiService(candidate));
    });

  });
})();

(function() {
  describe('utils.extractServiceSettings', function() {
    var utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-views', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('should identify booleans with default', function() {
      var schema = {
        an_entry: {
          type: 'boolean',
          name: 'present',
          'default': true
        }
      };

      var settings = utils.extractServiceSettings(schema);
      assert.isTrue(settings[0].isBool);
      assert.isUndefined(settings[0].isNumeric);
      assert.equal('checked', settings[0].value);
    });

    it('should identify booleans without default', function() {
      var schema = {
        an_entry: {
          type: 'boolean',
          name: 'present'
        }
      };

      var settings = utils.extractServiceSettings(schema);
      assert.isTrue(settings[0].isBool);
      assert.isUndefined(settings[0].isNumeric);
      assert.equal('', settings[0].value);
    });

    it('should identify text input with simple default', function() {
      var schema = {
        an_entry: {
          type: 'string',
          name: 'thing',
          'default': 'something'
        }
      };

      var settings = utils.extractServiceSettings(schema);
      assert.isUndefined(settings[0].isBool);
      assert.isUndefined(settings[0].isNumeric);
      assert.equal('something', settings[0].value);
    });

    it('should identify ints', function() {
      var schema = {
        an_entry: {
          type: 'int',
          name: 'thing',
          'default': 100
        }
      };

      var settings = utils.extractServiceSettings(schema);
      assert.isUndefined(settings[0].isBool);
      assert.isTrue(settings[0].isNumeric);
      assert.equal(100, settings[0].value);
    });

    it('should identify floats', function() {
      var schema = {
        an_entry: {
          type: 'float',
          name: 'thing',
          'default': 10.0
        }
      };

      var settings = utils.extractServiceSettings(schema);
      assert.isUndefined(settings[0].isBool);
      assert.isTrue(settings[0].isNumeric);
      assert.equal(10.0, settings[0].value);
    });

    it('should use config values if passed', function() {
      var schema = {
        a_string: {
          type: 'string',
          name: 'thing',
          'default': 'something\neven\nmore'
        },
        another_string: {
          type: 'string',
          name: 'thing2',
          'default': 'schema default'
        },
        a_float: {
          type: 'float',
          name: 'another thing',
          'default': 10.0
        }

      };

      var serviceConfig = {
        a_string: 'service value',
        some_other_thing: 'junk',
        a_float: 3.14159
      };

      var settings = utils.extractServiceSettings(schema, serviceConfig);
      assert.isUndefined(settings[0].isBool);
      assert.equal('service value', settings[0].value);

      // The service config value is not complete in that it does not have an
      // entry for 'another_string'.  As such, the value returned for that
      // entry is undefined.
      assert.isUndefined(settings[1].value);

      assert.isUndefined(settings[2].isBool);
      assert.equal(3.14159, settings[2].value);
    });
  });
})();

(function() {
  describe('utils.isGuiCharmUrl', function() {

    var utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-views', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('should recognize charm store URLs', function() {
      assert.isTrue(utils.isGuiCharmUrl('cs:precise/juju-gui-7'));
    });

    it('should recognize unofficial charm store URLs', function() {
      assert.isTrue(utils.isGuiCharmUrl('cs:~foobar/precise/juju-gui-7'));
    });

    it('should ignore owners of unofficial charm store URLs', function() {
      assert.isFalse(utils.isGuiCharmUrl('cs:~juju-gui/precise/foobar-7'));
    });

    it('should recognize local charm URLs', function() {
      assert.isTrue(utils.isGuiCharmUrl('local:juju-gui-3'));
    });

    it('should not allow junk on the end of the URL', function() {
      assert.isFalse(utils.isGuiCharmUrl('local:juju-gui-3 ROFLCOPTR!'));
    });

  });
})();


(function() {
  describe('DecoratedRelation', function() {

    var views, Y, inputRelation, source, target;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-views', function(Y) {
        views = Y.namespace('juju.views');
        done();
      });
    });

    beforeEach(function() {
      source = {
        modelId: function() {
          return 'source-id';
        }
      };
      target = {
        modelId: function() {
          return 'target-id';
        }
      };
      inputRelation = {
        getAttrs: function() {
          return {};
        }
      };

    });

    it('mirrors the relation\'s properties', function() {
      var relation = {
        getAttrs: function() {
          return {foo: 'bar'};
        }
      };
      relation = views.DecoratedRelation(relation, source, target);
      assert.deepProperty(relation, 'foo');
      assert.equal(relation.foo, 'bar');
    });

    it('exposes the source and target as attributes', function() {
      var relation = views.DecoratedRelation(inputRelation, source, target);
      assert.equal(relation.source, source);
      assert.equal(relation.target, target);
    });

    it('generates an ID that includes source and target IDs', function() {
      var relation = views.DecoratedRelation(inputRelation, source, target);
      assert.match(relation.compositeId, new RegExp(source.modelId()));
      assert.match(relation.compositeId, new RegExp(target.modelId()));
    });

    it('includes endpoint names in its ID, if they exist', function() {
      var source = {
        modelId: function() {
          return 'source-id';
        }
      };
      var target = {
        modelId: function() {
          return 'target-id';
        }
      };
      var firstEndpointName = 'endpoint-1';
      var secondEndpointName = 'endpoint-2';
      inputRelation.endpoints = [
        [null, {name: firstEndpointName}],
        [null, {name: secondEndpointName}]
      ];
      var relation = views.DecoratedRelation(inputRelation, source, target);
      assert.match(relation.compositeId, new RegExp(firstEndpointName));
      assert.match(relation.compositeId, new RegExp(secondEndpointName));
    });

    it('exposes the fact that a relation is a subordinate', function() {
      var inputRelation = {
        getAttrs: function() {
          return {scope: 'container'};
        }
      };
      var relation = views.DecoratedRelation(inputRelation, source, target);
      assert.isTrue(relation.isSubordinate);
    });

    it('exposes the fact that a relation is not a subordinate', function() {
      var inputRelation = {
        getAttrs: function() {
          return {scope: 'not-container'};
        }
      };
      var relation = views.DecoratedRelation(inputRelation, source, target);
      assert.isFalse(relation.isSubordinate);
    });

  });
})();

(function() {
  describe('utils.isSubordinateRelation', function() {

    var utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-views', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('can tell if a relation is a subordinate', function() {
      var relation = {scope: 'container'};
      assert.isTrue(utils.isSubordinateRelation(relation));
    });

    it('can tell if a relation is not a subordinate', function() {
      var relation = {scope: 'not-a-container'};
      assert.isFalse(utils.isSubordinateRelation(relation));
    });

  });
})();

(function() {
  describe('template helpers', function() {
    var Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-view-utils', 'handlebars'], function(Y) {
        done();
      });
    });

    it('pluralizes correctly', function() {
      var source = '{{ pluralize \'foo\' bar }}',
          template = Y.Handlebars.compile(source),
          context = {bar: 1},
          html = template(context);
      assert.equal('foo', html);

      context = {bar: 2};
      html = template(context);
      assert.equal('foos', html);

      context = {bar: [1]};
      html = template(context);
      assert.equal('foo', html);

      context = {bar: [1, 2]};
      html = template(context);
      assert.equal('foos', html);
    });

    it('can pluralize with an alternate word', function() {
      var source = '{{ pluralize \'foo\' bar \'fooi\' }}',
          template = Y.Handlebars.compile(source),
          context = {bar: 1},
          html = template(context);
      assert.equal('foo', html);

      context = {bar: 2};
      html = template(context);
      assert.equal('fooi', html);
    });

    it('truncates a string', function() {
      var source = '{{ truncate text 30 }}',
          template = Y.Handlebars.compile(source),
          context = {text: 'Lorem ipsum dolor sit amet consectetur'},
          html = template(context);
      assert.equal('Lorem ipsum dolor sit amet con...', html);
    });

    it('truncates a string with a trailing space', function() {
      var source = '{{ truncate text 30 }}',
          template = Y.Handlebars.compile(source),
          context = {text: 'Lorem ipsum dolor sit ametuco sectetur'},
          html = template(context);
      assert.equal('Lorem ipsum dolor sit ametuco...', html);
    });

    it('does not truncate a shorter string', function() {
      var source = '{{ truncate text 30 }}',
          template = Y.Handlebars.compile(source),
          context = {text: 'Lorem ipsum dolor sit amet'},
          html = template(context);
      assert.equal('Lorem ipsum dolor sit amet', html);
    });

    it('truncate handles an undefined value', function() {
      var source = '{{ truncate text 30 }}is empty',
          template = Y.Handlebars.compile(source),
          context = {text: undefined},
          html = template(context);
      assert.equal('is empty', html);
    });

    describe('showStatus', function() {
      var html, obj, template;

      before(function() {
        template = Y.Handlebars.compile('{{showStatus instance}}');
      });

      beforeEach(function() {
        obj = {agent_state: 'started'};
      });

      it('shows the instance status correctly', function() {
        html = template({instance: obj});
        assert.strictEqual(obj.agent_state, html);
      });

      it('avoids including status info if not present', function() {
        [undefined, null, ''].forEach(function(info) {
          obj.agent_state_info = info;
          html = template({instance: obj});
          assert.strictEqual(obj.agent_state, html, 'info: ' + info);
        });
      });

      it('includes status info if present', function() {
        obj.agent_state_info = 'some information';
        html = template({instance: obj});
        var expected = obj.agent_state + ': ' + obj.agent_state_info;
        assert.strictEqual(expected, html);
      });

    });

    describe('if_eq tests', function() {

      it('outputs success when equal', function() {
        var tpl = '{{#if_eq x y}}success{{/if_eq}}';
        var template = Y.Handlebars.compile(tpl);
        var html = template({x: 3, y: 3});

        assert.strictEqual('success', html);
      });

      it('output fails when not equal', function() {
        var tpl = 'fails{{#if_eq x y}}success{{/if_eq}}';
        var template = Y.Handlebars.compile(tpl);
        var html = template({x: 3, y: 4});

        assert.strictEqual('fails', html);
      });

      it('outputs the else clause when not equal', function() {
        var tpl = '{{#if_eq x y}}success{{else}}fails{{/if_eq}}';
        var template = Y.Handlebars.compile(tpl);
        var html = template({x: 3, y: 4});

        assert.strictEqual('fails', html);
      });
    });

    describe('unless_eq tests', function() {

      it('outputs success when not equal', function() {
        var tpl = '{{#unless_eq x y}}success{{/unless_eq}}';
        var template = Y.Handlebars.compile(tpl);
        var html = template({x: 3, y: 4});

        assert.strictEqual('success', html);
      });

      it('output fails when equal', function() {
        var tpl = 'fails{{#unless_eq x y}}success{{/unless_eq}}';
        var template = Y.Handlebars.compile(tpl);
        var html = template({x: 3, y: 3});

        assert.strictEqual('fails', html);
      });

      it('outputs the else clause when equal', function() {
        var tpl = '{{#unless_eq x y}}success{{else}}fails{{/unless_eq}}';
        var template = Y.Handlebars.compile(tpl);
        var html = template({x: 3, y: 3});

        assert.strictEqual('fails', html);
      });
    });

  });
})();

(function() {
  describe('landscape.landscapeAnnotations', function() {
    var Y, utils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-view-utils'], function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('returns an empty array if there are no unit annotations', function() {
      assert.equal(Y.Lang.isArray(utils.landscapeAnnotations({})), true);
    });

    it('returns lp reboot and upgrade annotations in an array', function() {
      var annotations = utils.landscapeAnnotations({
        annotations: {
          'landscape-needs-reboot': 'foo',
          'landscape-security-upgrades': 'bar'
        }
      });
      assert.equal(annotations[0], 'landscape-needs-reboot');
      assert.equal(annotations[1], 'landscape-security-upgrades');
    });

  });


  describe('utils.ensureTrailingSlash', function() {
    var utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-view-utils'], function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('adds a trailing slash if not already there', function() {
      var text = utils.ensureTrailingSlash('/foo/bar');
      assert.strictEqual(text, '/foo/bar/');
    });

    it('avoids adding a trailing slash if not required', function() {
      var text = utils.ensureTrailingSlash('/foo/bar/');
      assert.strictEqual(text, '/foo/bar/');
    });

  });

  describe('utils.getLandscapeURL', function() {
    var environment, models, service, unit, utils, Y;
    var requirements = ['juju-models', 'juju-view-utils'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        models = Y.namespace('juju.models');
        utils = Y.namespace('juju.views.utils');
        var db = new models.Database();
        // Set up environment annotations for testing.
        environment = db.environment;
        environment.set('annotations', {
          'landscape-url': 'http://landscape.example.com',
          'landscape-computers': '/computers/criteria/environment:test',
          'landscape-reboot-alert-url': '+alert:computer-reboot/info#power',
          'landscape-security-alert-url':
              '+alert:security-upgrades/packages/list?filter=security'
        });
        // Create the Service and a Unit model instances for testing.
        service = db.services.add({
          id: 'django',
          annotations: {'landscape-computers': '+service:django'}
        });
        unit = service.get('units').add({
          id: 'django/42',
          annotations: {'landscape-computer': '+unit:django-42'}
        });
        done();
      });
    });

    // Create and return a Landscape URL including the given path.
    var makeURL = function(path) {
      var address = 'http://landscape.example.com';
      var lastSegment = path || '/';
      return address + '/computers/criteria/environment:test' + lastSegment;
    };

    it('returns the generic Landscape URL', function() {
      var url = utils.getLandscapeURL(environment);
      var expected = makeURL();
      assert.strictEqual(url, expected);
    });

    it('returns the reboot Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, null, 'reboot');
      var expected = makeURL('+alert:computer-reboot/info#power');
      assert.strictEqual(url, expected);
    });

    it('returns the security upgrade Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, null, 'security');
      var expected = makeURL(
          '+alert:security-upgrades/packages/list?filter=security');
      assert.strictEqual(url, expected);
    });

    it('returns the service generic Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, service);
      var expected = makeURL('+service:django/');
      assert.strictEqual(url, expected);
    });

    it('returns the service reboot Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, service, 'reboot');
      var expected = makeURL(
          '+service:django/+alert:computer-reboot/info#power');
      assert.strictEqual(url, expected);
    });

    it('returns the service security upgrade Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, service, 'security');
      var expected = makeURL(
          '+service:django/+alert:security-upgrades/packages/list' +
          '?filter=security');
      assert.strictEqual(url, expected);
    });

    it('returns the unit generic Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, unit);
      var expected = makeURL('+unit:django-42/');
      assert.strictEqual(url, expected);
    });

    it('returns the unit reboot Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, unit, 'reboot');
      var expected = makeURL(
          '+unit:django-42/+alert:computer-reboot/info#power');
      assert.strictEqual(url, expected);
    });

    it('returns the unit security upgrade Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, unit, 'security');
      var expected = makeURL(
          '+unit:django-42/+alert:security-upgrades/packages/list' +
          '?filter=security');
      assert.strictEqual(url, expected);
    });

  });

  describe('utils.charmIconParser', function() {
    var utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-view-utils', 'io', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('Parses and sorts charm data into the required icon format', function() {
      var bundleData = Y.io('data/browserbundle.json', {sync: true});
      bundleData = JSON.parse(bundleData.responseText);
      var extra = {
        id: 'fooId',
        name: 'fooName',
        is_approved: false
      };

      // Add an extra unapproved charm to make sure it's removed
      bundleData.charm_metadata.foo = extra;

      var parsed = utils.charmIconParser(bundleData.charm_metadata);
      var expected = [{
        id: 'precise/haproxy-18',
        name: 'haproxy'
      }, {
        id: 'precise/mediawiki-10',
        name: 'mediawiki'
      }, {
        id: 'precise/memcached-7',
        name: 'memcached'
      }, {
        id: 'precise/mysql-27',
        name: 'mysql'
      }];
      assert.deepEqual(parsed, expected);
    });
  });

})();
