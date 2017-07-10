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
      content = <juju.components.Spinner />;
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
      <juju.components.Popup
        className="receipt-popup"
        close={this.props.close}
        type="wide">
        {content}
      </juju.components.Popup>);
  }
};

ReceiptPopup.propTypes = {
  addNotification: React.PropTypes.func.isRequired,
  chargeId: React.PropTypes.string.isRequired,
  close: React.PropTypes.func.isRequired,
  getReceipt: React.PropTypes.func.isRequired
};

YUI.add('receipt-popup', function() {
  juju.components.ReceiptPopup = ReceiptPopup;
}, '0.1.0', {
  requires: [
    'loading-spinner',
    'popup'
  ]
});
