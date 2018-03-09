/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const ReceiptPopup = require('./receipt-popup/receipt-popup');
const DateDisplay = require('../../date-display/date-display');
const ExpandingRow = require('../../expanding-row/expanding-row');
const GenericButton = require('../../generic-button/generic-button');
const Spinner = require('../../spinner/spinner');

class PaymentCharges extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      charges: null,
      loading: false,
      showPopup: ''
    };
  }

  componentWillMount() {
    this._getCharges();
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Show or hide the receipt popup.

    @param chargeId {String|Null} The charge to display.
  */
  _togglePopup(chargeId=null) {
    this.setState({showPopup: chargeId});
  }

  /**
    Get the payment details for the user.

    @method _getCharges
  */
  _getCharges() {
    this.setState({loading: true}, () => {
      const username = this.props.username;
      const xhr = this.props.payment.getCharges(username, (error, response) => {
        if (error) {
          const message = 'Could not load the list of charges';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          return;
        }
        this.setState({loading: false, charges: response});
      });
      this.xhrs.push(xhr);
    });
  }

  /**
    Generate the line items for a charge.

    @param lineItems {Array} The list of line items.
    @returns {Object} The markup for the line items.
  */
  _generateLineItems(lineItems) {
    if (!lineItems || !lineItems.length) {
      return (
        <div className="payment-charges__line-items">
          There are no items for this charge.
        </div>);
    }
    const items = lineItems.map((item, i) => {
      return (
        <li className="user-profile__list-row twelve-col"
          key={item.name + i}>
          <div className="three-col no-margin-bottom">
            {item.name}
          </div>
          <div className="three-col no-margin-bottom">
            {item.details}
          </div>
          <div className="three-col no-margin-bottom">
            {item.usage}
          </div>
          <div className="three-col last-col no-margin-bottom">
            {item.price}
          </div>
        </li>);
    });
    return (
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
          {items}
        </ul>
      </div>);
  }

  /**
    Generate the list of charges.

    @returns {Object} The markup for the list of charges.
  */
  _generateCharges() {
    if (this.state.loading) {
      return <Spinner />;
    }
    const charges = this.state.charges;
    if (!charges || !charges.length) {
      return (
        <div>
          You do not have any charges.
        </div>);
    }
    let list = charges.map(charge => {
      return (
        <ExpandingRow
          classes={{
            'twelve-col': true,
            'user-profile__list-row': true
          }}
          clickable={true}
          key={charge.id}>
          <div>
            <div className="two-col no-margin-bottom">
              {charge.statementId}
            </div>
            <div className="two-col no-margin-bottom">
              <DateDisplay
                date={charge.for}
                relative={true} />
            </div>
            <div className="two-col no-margin-bottom">
              {charge.price / 100} {charge.currency}
            </div>
            <div className="two-col no-margin-bottom">
              {charge.vat / 100} {charge.currency}
            </div>
            <div className="two-col last-col no-margin-bottom">
              {(charge.price + charge.vat) / 100} {charge.currency}
            </div>
            <div className="two-col last-col no-margin-bottom">
              <GenericButton
                action={this._togglePopup.bind(this, charge.id)}
                disabled={false}
                type="inline-neutral">
                Show receipt
              </GenericButton>
            </div>
          </div>
          <div className="twelve-col">
            {this._generateLineItems(charge.lineItems)}
          </div>
        </ExpandingRow>);
    });
    return (
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
        {list}
      </ul>);
  }

  /**
    Generate the receipt popup.

    @returns {Object} The terms popup markup.
  */
  _generatePopup() {
    const charge = this.state.showPopup;
    if (!charge) {
      return null;
    }
    return (
      <ReceiptPopup
        addNotification={this.props.addNotification}
        chargeId={charge}
        close={this._togglePopup.bind(this)}
        getReceipt={this.props.payment.getReceipt} />);
  }

  render() {
    return (
      <div className="payment-charges">
        <div className="payment__section">
          <h2 className="payment__title twelve-col">
            Charges
          </h2>
          {this._generateCharges()}
          {this._generatePopup()}
        </div>
      </div>
    );
  }
};

PaymentCharges.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  payment: shapeup.shape({
    getCharges: PropTypes.func,
    getReceipt: PropTypes.func,
    reshape: shapeup.reshapeFunc
  }),
  username: PropTypes.string.isRequired
};

module.exports = PaymentCharges;
