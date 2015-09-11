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

describe('prettify', function() {
  var container, utils, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['node',
      'juju-tests-utils',
      'prettify'], function(Y) {
      utils = Y.namespace('juju-tests.utils');
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'container');
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
