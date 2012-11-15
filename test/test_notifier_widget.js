'use strict';

describe('notifier widget', function() {
  var Notifier, notifierBox, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use('notifier', 'node-event-simulate',
      function(Y) {
        Notifier = Y.namespace('juju.widgets').Notifier;
        done();
      });
  });

  // Create the notifier box and attach it as first element of the body.
  beforeEach(function() {
    notifierBox = Y.Node.create('<div id="notifier-box"></div>');
    notifierBox.setStyle('display', 'none');
    Y.one('body').prepend(notifierBox);
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

  it('should be able to display a notification', function() {
    var notifier = makeNotifier(),
        notifierNodes = notifierBox.all('.' + notifier.getClassName());
    assert.equal(1, notifierNodes.size());
  });

  it('should display the given title and message', function() {
    var notifier = makeNotifier('mytitle', 'mymessage'),
        notifierNode = notifierBox.one('.' + notifier.getClassName());
    assert.equal('mytitle', notifierNode.one('h3').getContent());
    assert.equal('mymessage', notifierNode.one('div').getContent());
  });

  it('should be able to display multiple notifications', function() {
    var notifier = makeNotifier();
    makeNotifier();
    var notifierNodes = notifierBox.all('.' + notifier.getClassName());
    assert.equal(2, notifierNodes.size());
  });

  it('should display new notifications on top', function() {
    makeNotifier('mytitle1', 'mymessage1');
    var notifier = makeNotifier('mytitle2', 'mymessage2'),
        notifierNode = notifierBox.one('.' + notifier.getClassName());
    assert.equal('mytitle2', notifierNode.one('h3').getContent());
    assert.equal('mymessage2', notifierNode.one('div').getContent());
  });

  it('should destroy notifications after N milliseconds', function(done) {
    var notifier = makeNotifier('mytitle', 'mymessage', 1),
        selector = '.' + notifier.getClassName();
    // A timeout of 250 milliseconds is used so that we ensure the destroying
    // animation can be completed.
    setTimeout(function() {
      var notifierNodes = notifierBox.all(selector);
      assert.equal(0, notifierNodes.size());
      done();
    }, 250);
  });

  it('should prevent notification removal on mouse enter', function(done) {
    var notifier = makeNotifier('mytitle', 'mymessage', 1),
        selector = '.' + notifier.getClassName();
    notifierBox.one(selector).simulate('mouseover');
    // A timeout of 250 milliseconds is used so that we ensure the node is not
    // preserved by the destroying animation.
    setTimeout(function() {
      var notifierNodes = notifierBox.all(selector);
      assert.equal(1, notifierNodes.size());
      done();
    }, 250);
  });

});
