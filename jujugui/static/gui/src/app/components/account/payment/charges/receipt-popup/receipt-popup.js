/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const Spinner = require('../../../../spinner/spinner');
const Popup = require('../../../../popup/popup');

class ReceiptPopup extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      receipt: null,
      loading: false
    };
  }

  componentWillMount() {
    this._getReceipt();
  }

  componentWillUnmount() {
    this.xhrs.forEach((xhr) => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Get a receipt.

    @method _getReceipt
  */
  _getReceipt() {
    this.setState({loading: true}, () => {
      const chargeId = this.props.chargeId;
      const xhr = this.props.getReceipt(chargeId, (error, response) => {
        if (error) {
          const message = 'Could not load the receipt';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          return;
        }
        this.setState({loading: false, receipt: response});
      });
      this.xhrs.push(xhr);
    });
  }

  render() {
    let content;
    const receipt = this.state.receipt;
    if (this.state.loading) {
      content = <Spinner />;
    } else {
      content = (
        <div className="receipt-popup__container">
          <iframe height="100%"
            src={
              `data:text/html;charset=utf-8,${encodeURIComponent(receipt)}`}
            width="100%">
          </iframe>
        </div>);
    }
    return (
      <Popup
        className="receipt-popup"
        close={this.props.close}
        type="wide">
        {content}
      </Popup>);
  }
};

ReceiptPopup.propTypes = {
  addNotification: PropTypes.func.isRequired,
  chargeId: PropTypes.string.isRequired,
  close: PropTypes.func.isRequired,
  getReceipt: PropTypes.func.isRequired
};

module.exports = ReceiptPopup;
