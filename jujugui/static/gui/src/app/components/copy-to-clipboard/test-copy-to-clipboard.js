/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

var juju = {components: {}};  // eslint-disable-line no-unused-vars
var testUtils = React.addons.TestUtils;
var realClipboard;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('CopyToClipboard', function() {
  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('copy-to-clipboard', function() { done(); });
  });

  beforeEach(function() {
    realClipboard = window.Clipboard;
    window.Clipboard = sinon.spy();
  });

  afterEach(function() {
    window.Clipboard = realClipboard;
  });

  it('renders with a default value', function() {
    var output = jsTestUtils.shallowRender(
        <juju.components.CopyToClipboard/>);
    var className = output.props.className;
    var expected = (
      <div className={className}>
        <input className={className + '__input'}
               ref="input"
               readOnly="true"
               type="text"
               value=""/>
        <button className={className + '__btn'}
                ref="btn"/>
      </div>
    );
    assert.deepEqual(output, expected, 'Did not render as expected');
  });

  it('renders a user-provided value properly', function() {
    var value = 'foobar';
    var output = testUtils.renderIntoDocument(
        <juju.components.CopyToClipboard value={value}/>);
    assert.equal(output.refs.input.value, value,
                 'Value is not set properly for input');
  });

  it('initializes the Clipboard widget', function() {
    var component = testUtils.renderIntoDocument(
        <juju.components.CopyToClipboard/>);
    var node = ReactDOM.findDOMNode(component).querySelector('button');
    assert.deepEqual(Clipboard.getCall(0).args[0], node,
                     'Clipboard was not initialized with expected node');
  });
});
