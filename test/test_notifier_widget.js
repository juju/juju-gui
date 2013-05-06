'use strict';


describe('notifier widget', function() {
  var Notifier, notifierBox, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['notifier',
      'juju-tests-utils',
      'node-event-simulate'], function(Y) {
      Notifier = Y.namespace('juju.widgets').Notifier;
      done();
    });
  });

  // Create the notifier box and attach it as first element of the body.
  beforeEach(function() {
    notifierBox = Y.namespace('juju-tests.utils')
    .makeContainer('notifier-box');
  });

  // Destroy the notifier box created in beforeEach.
  afterEach(function() {
    notifierBox.remove();
    notifierBox.destroy(true);
  });

  // Factory rendering and returning a notifier instance.
  var makeNotifier = function(title, message, timeout) {
    var notifier = new Notifier({
      title: title || 'mytitle',
      message: message || 'mymessage',
      timeout: timeout || 10000
    });
    notifier.render(notifierBox);
    return notifier;
  };

  // Assert the notifier box contains the expectedNumber of notifiers.
  var assertNumNotifiers = function(expectedNumber) {
    assert.equal(expectedNumber, notifierBox.get('children').size());
  };

  it('should be able to display a notification', function() {
    makeNotifier();
    assertNumNotifiers(1);
  });

  it('should display the given title and message', function() {
    makeNotifier('mytitle', 'mymessage');
    var notifierNode = notifierBox.one('*');
    assert.equal('mytitle', notifierNode.one('h3').getContent());
    assert.equal('mymessage', notifierNode.one('div').getContent());
  });

  it('should be able to display multiple notifications', function() {
    var number = 5;
    for (var i = 0; i < number; i += 1) {
      makeNotifier();
    }
    assertNumNotifiers(number);
  });

  it('should display new notifications on top', function() {
    makeNotifier('mytitle1', 'mymessage1');
    makeNotifier('mytitle2', 'mymessage2');
    var notifierNode = notifierBox.one('*');
    assert.equal('mytitle2', notifierNode.one('h3').getContent());
    assert.equal('mymessage2', notifierNode.one('div').getContent());
  });

  it('should destroy notifications after N milliseconds', function(done) {
    makeNotifier('mytitle', 'mymessage', 1);
    // A timeout of 250 milliseconds is used so that we ensure the destroying
    // animation can be completed.
    setTimeout(function() {
      assertNumNotifiers(0);
      done();
    }, 250);
  });

  it('should destroy notifications on click', function(done) {
    makeNotifier();
    notifierBox.one('*').simulate('click');
    // A timeout of 250 milliseconds is used so that we ensure the destroying
    // animation can be completed.
    setTimeout(function() {
      assertNumNotifiers(0);
      done();
    }, 250);
  });

  it('should prevent notification removal on mouse enter', function(done) {
    makeNotifier('mytitle', 'mymessage', 1);
    notifierBox.one('*').simulate('mouseover');
    // A timeout of 250 milliseconds is used so that we ensure the node is not
    // preserved by the destroying animation.
    setTimeout(function() {
      assertNumNotifiers(1);
      done();
    }, 250);
  });

});

