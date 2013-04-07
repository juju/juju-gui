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
              button = panel_node.one('.btn-danger');
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
              button = panel_node.one('.btn:not(.btn-danger)');
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
              button = panel_node.one('.btn-danger');
      button.getHTML().should.equal('Second Action Label');
      button.simulate('click');
      confirmed.should.equal(true);
      panel.destroy();
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

  it('shows a relation from the perspective of a service', function() {
    var db = new models.Database(),
        service = new models.Service({
          id: 'mysql',
          charm: 'cs:mysql',
          unit_count: 1,
          loaded: true});
    db.relations.add({
      'interface': 'mysql',
      scope: 'global',
      endpoints: [
        ['mysql', {role: 'server', name: 'mydb'}],
        ['mediawiki', {role: 'client', name: 'db'}]],
      'id': 'relation-0000000002'
    });
    db.services.add([service]);
    var res = utils.getRelationDataForService(db, service);
    res.length.should.equal(1);
    res = res[0];
    res['interface'].should.eql('mysql');
    res.scope.should.equal('global');
    res.id.should.equal('relation-0000000002');
    res.ident.should.equal('mydb:2');
    res.near.service.should.equal('mysql');
    res.near.role.should.equal('server');
    res.near.name.should.equal('mydb');
    res.far.service.should.equal('mediawiki');
    res.far.role.should.equal('client');
    res.far.name.should.equal('db');
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

    var utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-views', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('should translate service states correctly', function() {
      function assertState(state, expected) {
        var unit = {agent_state: state};
        assert.equal(utils.simplifyState(unit), expected);
      }
      // "started" is turned into "running"
      assertState('started', 'running');
      // Any state that ends in "-error" is simplified to just "error".
      assertState('install-error', 'error');
      assertState('foo-error', 'error');
      assertState('-error', 'error');
      // Any other state (should just be "pending" and "installed") are
      // "pending".
      assertState('pending', 'pending');
      assertState('installed', 'pending');
      assertState('waiting', 'pending');
      assertState('schlepping', 'pending');
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

    var utils, views, Y, inputRelation, source, target;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-views', function(Y) {
        utils = Y.namespace('juju.views.utils');
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
      var source =  '{{ pluralize \'foo\' bar }}',
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

      context = {bar: [1,2]};
      html = template(context);
      assert.equal('foos', html);
    });

    it('can pluralize with an alternate word', function() {
      var source =  '{{ pluralize \'foo\' bar \'fooi\' }}',
          template = Y.Handlebars.compile(source),
          context = {bar: 1},
          html = template(context);
      assert.equal('foo', html);

      context = {bar: 2};
      html = template(context);
      assert.equal('fooi', html);
    });
  });
})();
