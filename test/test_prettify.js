'use strict';

describe('prettify', function() {
  var container, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['node',
      'juju-tests-utils',
      'prettify'], function(Y) {
      done();
    });
  });

  beforeEach(function() {
    container = Y.namespace('juju-tests.utils').makeContainer('container');
  });

  afterEach(function() {
    container.remove(true);
  });

  it('exists', function() {
    assert.isObject(Y.prettify);
  });

  it('renders code', function() {
    var code = [
      'from foo import bar',
      'from baz import fnord',
      '',
      'x = bar(fnord)',
      'print x'
    ].join('\n');
    Y.prettify.renderPrettyPrintedFile(container, code);
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
