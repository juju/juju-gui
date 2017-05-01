/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('ReceiptPopup', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('receipt-popup', function() { done(); });
  });

  it('can display the loading spinner', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.ReceiptPopup
        addNotification={sinon.stub()}
        chargeId="charge123"
        close={close}
        getReceipt={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
        <juju.components.Spinner />);
    expect(output.props.children).toEqualJSX(expected);
  });

  it('can display the receipt', function() {
    const close = sinon.stub();
    const getReceipt = sinon.stub().callsArgWith(1, null, '<html>...</html>');
    const renderer = jsTestUtils.shallowRender(
      <juju.components.ReceiptPopup
        addNotification={sinon.stub()}
        chargeId="charge123"
        close={close}
        getReceipt={getReceipt} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.Popup
        className="receipt-popup"
        close={close}
        type="wide">
        <div className="receipt-popup__container">
          <iframe height="100%"
            src="data:text/html;charset=utf-8,<html>...</html>"
            width="100%">
          </iframe>
        </div>
      </juju.components.Popup>);
    expect(output).toEqualJSX(expected);
  });

  it('can handle errors when getting the receipt', function() {
    const addNotification = sinon.stub();
    const getReceipt = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    jsTestUtils.shallowRender(
      <juju.components.ReceiptPopup
        addNotification={addNotification}
        chargeId="charge123"
        close={sinon.stub()}
        getReceipt={getReceipt} />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load the receipt',
      message: 'Could not load the receipt: Uh oh!',
      level: 'error'
    });
  });

  it('can close the popup', function() {
    const close = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.ReceiptPopup
        addNotification={sinon.stub()}
        chargeId="charge123"
        close={close}
        getReceipt={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    output.props.close();
    assert.equal(close.callCount, 1);
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    const getReceipt = sinon.stub().returns({abort: abort});
    const renderer = jsTestUtils.shallowRender(
      <juju.components.ReceiptPopup
        addNotification={sinon.stub()}
        chargeId="charge123"
        close={sinon.stub()}
        getReceipt={getReceipt} />, true);
    renderer.unmount();
    assert.equal(abort.callCount, 1);
  });
});
