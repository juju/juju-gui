'use strict';

describe('fileviewer', function() {
  var container, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'browser-fileviewer-widget',
      'node',
      'prettify'
    ], function(Y) {
      done();
    });
  });

  beforeEach(function() {
    container = Y.Node.create('<div id="container"></div>');
    Y.one('body').prepend(container);
  });

  afterEach(function() {
    container.remove(true);
  });

  it('initializes', function() {
    var fv = new Y.juju.widgets.browser.FileViewer();
    assert.isObject(fv);
  });

  it('renders code', function() {
    var code = [
      'from foo import bar',
      'from baz import fnord',
      '',
      'x = bar(fnord)',
      'print x'
    ].join('\n');
    var fv = new Y.juju.widgets.browser.FileViewer({code: code});
    fv.render(container);
    var codeblock = Y.one('.prettyprint');
    assert.isObject(
        codeblock,
        'No pretty print block found.');
    assert.isTrue(
        codeblock.hasClass('prettyprinted'),
        'Pretty print block found, but not pretty printed.');
    assert.isTrue(
        codeblock.hasClass('linenums'),
        'Pretty print block is pretty printed, but does not have linenums.');
    assert.notEqual(
        -1, codeblock.get('text').indexOf('from foo import bar'),
        'Code not in pretty print block.');
  });
});
