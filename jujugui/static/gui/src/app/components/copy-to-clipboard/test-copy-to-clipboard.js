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

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('CopyToClipboard', function() {
  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('copy-to-clipboard', function() { done(); });
  });

  it('renders a user-provided value properly', function() {
    var value = 'foobar';
    var output = testUtils.renderIntoDocument(
        <juju.components.CopyToClipboard value={value}/>);
    assert.ok(output.refs.copyToClipboardInput, 'Copy field is missing');
    assert.ok(output.refs.copyToClipboardBtn, 'Copy button is missing');
    assert.equal(output.refs.copyToClipboardInput.value, value,
                 'Value is not set properly for input');
  });

  it('renders the default value properly', function() {
    var output = testUtils.renderIntoDocument(
        <juju.components.CopyToClipboard/>);
    assert.ok(output.refs.copyToClipboardInput, 'Copy field is missing');
    assert.ok(output.refs.copyToClipboardBtn, 'Copy button is missing');
    assert.equal(output.refs.copyToClipboardInput.value, '',
                 'Value is not set properly for input');
  });

  /*
  it('successfully copies to the clipboard', function() {
    var component = testUtils.renderIntoDocument(
        <juju.components.CopyToClipboard/>);
    var btn = component.refs.copyToClipboardBtn;
    var clipboard = component.clipboard;
    sinon.spy(clipboard, 'listenClick');
    testUtils.Simulate.click(btn);
    assert.ok(clipboard.listenClick.calledOnce,
              'Click listener was not invoked.');
    clipboard.listenClick.restore();
  });
  */
});
