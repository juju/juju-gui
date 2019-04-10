/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ReceiptPopup = require('./receipt-popup');

describe('ReceiptPopup', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <ReceiptPopup
      addNotification={options.addNotification || sinon.stub()}
      chargeId={options.chargeId || 'charge123'}
      close={options.close || sinon.stub()}
      getReceipt={options.getReceipt || sinon.stub()} />
  );

  it('can display the loading spinner', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('Spinner').length, 1);
  });

  it('can display the receipt', function() {
    const getReceipt = sinon.stub().callsArgWith(1, null, '<html>...</html>');
    const wrapper = renderComponent({getReceipt});
    assert.equal(
      wrapper.find('iframe').prop('src').includes('%3Chtml%3E...%3C%2Fhtml%3E'),
      true);
  });

  it('can handle errors when getting the receipt', function() {
    const addNotification = sinon.stub();
    const getReceipt = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    renderComponent({
      addNotification,
      getReceipt
    });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load the receipt',
      message: 'Could not load the receipt: Uh oh!',
      level: 'error'
    });
  });

  it('can close the popup', function() {
    const close = sinon.stub();
    const wrapper = renderComponent({close});
    wrapper.props().close();
    assert.equal(close.callCount, 1);
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    const getReceipt = sinon.stub().returns({abort: abort});
    const wrapper = renderComponent({getReceipt});
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });
});
