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
              function() {confirmed = true;}
         );
          panel.show();
          var panel_node = panel.get('boundingBox'),
              button = panel_node.one('.btn:not(.btn-danger)');
          button.getHTML().should.equal('Cancel');
          button.simulate('click');
          confirmed.should.equal(false);
          panel.destroy();
       });

  });
}) ();

describe('utilities', function() {
  var Y, views;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-views'], function(Y) {
      views = Y.namespace('juju.views');
      done();
        });
  });

  it('must be able to display humanize time ago messages', function() {
    var now = Y.Lang.now();
    // Javascript timestamps are in milliseconds
    views.humanizeTimestamp(now).should.equal('less than a minute ago');
    views.humanizeTimestamp(now + 600000).should.equal('10 minutes ago');

  });

});

(function() {
  describe('form validateion', function() {

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
      assert.equal(utils.validate({a_float: '-42'}, schema).a_float, undefined);
      assert.equal(utils.validate({a_float: '+42'}, schema).a_float, undefined);
      assert.equal(utils.validate({a_float: ' +42 '}, schema).a_float, undefined);
      // Digits before the decimal point are not strictly required.
      assert.equal(utils.validate({a_float: '.5'}, schema).a_float, undefined);
      assert.equal(utils.validate({a_float: '-0.5'}, schema).a_float, undefined);
      assert.equal(utils.validate({a_float: ' -0.5 '}, schema).a_float, undefined);
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
