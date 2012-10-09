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

  it('should execute only the last method, and is reusable', function(done) {
    var track = [],
        delay = utils.Delayer();

    delay(function() {
      track.push('a');
    }, 50);
    delay(function() {
      track.push('b');
    }, 50);
    delay(function() {
      // This is done immediately.
      delay(function() { track.push('c'); });
      assert.equal('c', track.join(''));
      done();
    }, 1);
  });

  it('should execute only the last method, once', function(done) {
    var delay = utils.Delayer(true);
    delay(function() {
      try {
        delay(function() { });
        assert.fail('did not throw an error', 'should have.');
      } catch (e) {
        e.should.equal('already performed a task.');
      }
      done();
    }, 1);
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
      // "started" is turned into "running"
      assert.equal(utils.simplifyState('started'), 'running');
      // Any state that ends in "-error" is simplified to just "error".
      assert.equal(utils.simplifyState('install-error'), 'error');
      assert.equal(utils.simplifyState('foo-error'), 'error');
      assert.equal(utils.simplifyState('-error'), 'error');
      // Any other state (should just be "pending" and "installed") are
      // "pending".
      assert.equal(utils.simplifyState('pending'), 'pending');
      assert.equal(utils.simplifyState('installed'), 'pending');
      assert.equal(utils.simplifyState('waiting'), 'pending');
      assert.equal(utils.simplifyState('schlepping'), 'pending');
    });
  });
})();

(function() {
  describe('juju base view', function() {

    var jujuBaseView, views, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-views', function(Y) {
        views = Y.namespace('juju.views');
        jujuBaseView = new views.JujuBaseView();
        done();
      });
    });

    it('should translate unit states to styles correctly', function() {
      // The states 'installed', 'pending' and 'stopped' are turned
      // into 'state-pending'.
      assert.equal('state-pending', jujuBaseView.stateToStyle('installed'));
      assert.equal('state-pending', jujuBaseView.stateToStyle('pending'));
      assert.equal('state-pending', jujuBaseView.stateToStyle('stopped'));
      // The state 'started' is turned into 'state-started'.
      assert.equal('state-started', jujuBaseView.stateToStyle('started'));
      // The states 'install-error', 'start-error' and 'stop-error' are turned
      // into 'state-error'.
      assert.equal('state-error', jujuBaseView.stateToStyle('install-error'));
      assert.equal('state-error', jujuBaseView.stateToStyle('start-error'));
      assert.equal('state-error', jujuBaseView.stateToStyle('stop-error'));
    });

    it('should add the computed class to the existing ones', function() {
      var classes = jujuBaseView.stateToStyle('pending', 'existing');
      assert.include(classes, 'state-pending');
      assert.include(classes, 'existing');
    });

  });
})();
