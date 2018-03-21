/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');
const enzyme = require('enzyme');

const PaymentCharges = require('./charges');
const DateDisplay = require('../../date-display/date-display');
const ExpandingRow = require('../../expanding-row/expanding-row');
const GenericButton = require('../../generic-button/generic-button');

describe('PaymentCharges', function() {
  let acl, payment;

  const renderComponent = (options = {}) => enzyme.shallow(
    <PaymentCharges
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      payment={options.payment || payment}
      username={options.username || 'spinach'} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    payment = {
      getCharges: sinon.stub(),
      getReceipt: sinon.stub(),
      reshape: shapeup.reshapeFunc
    };
  });

  it('can display the loading spinner', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('Spinner').length, 1);
  });

  it('can display charges', function() {
    payment.getCharges = sinon.stub().callsArgWith(1, null, [{
      id: 'TEST-12344',
      statementId: '12344',
      price: 10000,
      vat: 2000,
      currency: 'USD',
      for: '2016-01-02T15:04:05Z',
      lineItems: [{
        name: 'this is line 1',
        details: 'a bit more details for line 1',
        usage: 'something',
        price: '48'
      }]
    }]);
    const wrapper = renderComponent();
    const expected = (
      <div className="payment-charges">
        <div className="payment__section">
          <h2 className="payment__title twelve-col">
            Charges
          </h2>
          <ul className="user-profile__list twelve-col">
            <li className="user-profile__list-header twelve-col">
              <div className="two-col no-margin-bottom">
                ID
              </div>
              <div className="two-col no-margin-bottom">
                Date
              </div>
              <div className="two-col no-margin-bottom">
                Price
              </div>
              <div className="two-col no-margin-bottom">
                VAT
              </div>
              <div className="two-col last-col no-margin-bottom">
                Total
              </div>
            </li>
            <ExpandingRow
              classes={{
                'twelve-col': true,
                'user-profile__list-row': true
              }}
              clickable={true}
              key="TEST-12344">
              <div>
                <div className="two-col no-margin-bottom">
                  12344
                </div>
                <div className="two-col no-margin-bottom">
                  <DateDisplay
                    date="2016-01-02T15:04:05Z"
                    relative={true} />
                </div>
                <div className="two-col no-margin-bottom">
                  {100} {'USD'}
                </div>
                <div className="two-col no-margin-bottom">
                  {20} {'USD'}
                </div>
                <div className="two-col last-col no-margin-bottom">
                  {120} {'USD'}
                </div>
                <div className="two-col last-col no-margin-bottom">
                  <GenericButton
                    action={wrapper.find('GenericButton').prop('action')}
                    disabled={false}
                    type="inline-neutral">
                    Show receipt
                  </GenericButton>
                </div>
              </div>
              <div className="twelve-col">
                <div className="payment-charges__line-items">
                  <h4>Charges for:</h4>
                  <ul className="user-profile__list twelve-col">
                    <li className="user-profile__list-header twelve-col">
                      <div className="three-col no-margin-bottom">
                        Name
                      </div>
                      <div className="three-col no-margin-bottom">
                        Details
                      </div>
                      <div className="three-col no-margin-bottom">
                        Usage
                      </div>
                      <div className="three-col last-col no-margin-bottom">
                        Price
                      </div>
                    </li>
                    <li className="user-profile__list-row twelve-col"
                      key="this is line 10">
                      <div className="three-col no-margin-bottom">
                        this is line 1
                      </div>
                      <div className="three-col no-margin-bottom">
                        a bit more details for line 1
                      </div>
                      <div className="three-col no-margin-bottom">
                        something
                      </div>
                      <div className="three-col last-col no-margin-bottom">
                        48
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </ExpandingRow>
          </ul>
          {null}
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display when there are no charges', function() {
    payment.getCharges = sinon.stub().callsArgWith(1, null, []);
    const wrapper = renderComponent();
    const expected = (
      <div className="payment-charges">
        <div className="payment__section">
          <h2 className="payment__title twelve-col">
            Charges
          </h2>
          <div>
            You do not have any charges.
          </div>
          {null}
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display when there are no line items', function() {
    payment.getCharges = sinon.stub().callsArgWith(1, null, [{
      id: 'TEST-12344',
      statementId: '12344',
      price: 10000,
      vat: 2000,
      currency: 'USD',
      for: '2016-01-02T15:04:05Z',
      lineItems: []
    }]);
    const wrapper = renderComponent();
    const expected = (
      <div className="payment-charges__line-items">
        There are no items for this charge.
      </div>);
    assert.compareJSX(wrapper.find('.payment-charges__line-items'), expected);
  });

  it('can handle errors when getting the charges', function() {
    const addNotification = sinon.stub();
    payment.getCharges = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    renderComponent({ addNotification });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load the list of charges',
      message: 'Could not load the list of charges: Uh oh!',
      level: 'error'
    });
  });

  it('can display the popup', function() {
    payment.getCharges = sinon.stub().callsArgWith(1, null, [{
      id: 'TEST-12344',
      statementId: '12344',
      price: 10000,
      vat: 2000,
      currency: 'USD',
      for: '2016-01-02T15:04:05Z',
      lineItems: []
    }]);
    const wrapper = renderComponent();
    wrapper.find('GenericButton').props().action();
    wrapper.update();
    const popup = wrapper.find('ReceiptPopup');
    assert.equal(popup.length, 1);
    assert.equal(popup.prop('chargeId'), 'TEST-12344');
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    payment.getCharges = sinon.stub().returns({abort: abort});
    const wrapper = renderComponent();
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });
});
