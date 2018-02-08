/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ReceiptPopup = require('./receipt-popup');
const Spinner = require('../../../../spinner/spinner');
const Popup = require('../../../../popup/popup');

const jsTestUtils = require('../../../../../utils/component-test-utils');

describe('ReceiptPopup', function() {

  it('can display the loading spinner', function() {
    const renderer = jsTestUtils.shallowRender(
      <ReceiptPopup
        addNotification={sinon.stub()}
        chargeId="charge123"
        close={close}
        getReceipt={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <Spinner />);
    expect(output.props.children).toEqualJSX(expected);
  });

  it('can display the receipt', function() {
    const close = sinon.stub();
    const getReceipt = sinon.stub().callsArgWith(1, null, '<html>...</html>');
    const renderer = jsTestUtils.shallowRender(
      <ReceiptPopup
        addNotification={sinon.stub()}
        chargeId="charge123"
        close={close}
        getReceipt={getReceipt} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <Popup
        className="receipt-popup"
        close={close}
        type="wide">
        <div className="receipt-popup__container">
          <iframe height="100%"
            src="data:text/html;charset=utf-8,%3Chtml%3E...%3C%2Fhtml%3E"
            width="100%">
          </iframe>
        </div>
      </Popup>);
    expect(output).toEqualJSX(expected);
  });

  it('can handle errors when getting the receipt', function() {
    const addNotification = sinon.stub();
    const getReceipt = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    jsTestUtils.shallowRender(
      <ReceiptPopup
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
      <ReceiptPopup
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
      <ReceiptPopup
        addNotification={sinon.stub()}
        chargeId="charge123"
        close={sinon.stub()}
        getReceipt={getReceipt} />, true);
    renderer.unmount();
    assert.equal(abort.callCount, 1);
  });
});
