/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const BasicTable = require('../../basic-table/basic-table');
const Spinner = require('../../spinner/spinner');

/**
  React component used to display a list of the users invoices in their profile.
*/
class ProfileInvoiceList extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      data: [{
        number: 100001,
        status: 'Paid',
        chargedTo: 'card ending 1234',
        date: '12/05/2017'
      }, {
        number: 100002,
        status: 'Declined: will retry',
        chargedTo: 'card ending 1231',
        date: '12/05/2017'
      }, {
        number: 100003,
        status: 'Paid',
        chargedTo: 'card ending 1232',
        date: '14/05/2017'
      }, {
        number: 100004,
        status: 'Paid',
        chargedTo: 'card ending 1233',
        date: '13/05/2017'
      }, {
        number: 100005,
        status: 'Paid',
        chargedTo: 'card ending 1234',
        date: '12/05/2017'
      }],
      loading: false
    };
  }

  componentWillMount() {
    const user = this.props.user;
    if (user) {
      this._fetchInvoices(user);
    }
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  componentWillReceiveProps(nextProps) {
    const props = this.props;
    if (props.user !== nextProps.user) {
      this._fetchInvoices(nextProps.user);
    }
  }

  /**
    Fetch the users invoices
    @param {String} user The external user name in the format "user@external".
  */
  _fetchInvoices(user) {
    // @todo Fetch invoices for this user
  }

  /**
    Prevents the default actions on the link and navigates to the specific invoice
    for the supplied id via changeState.
    @param {String} path The GUI invoice path to navigate to.
    @param {Object} e The click event.
  */
  _navigateToInvoice(path, e) {
    e.preventDefault();
    e.stopPropagation();
  }

  render() {
    let content;
    if (this.state.loading) {
      content = (<Spinner />);
    } else {
      const rows = (this.props.data || this.state.data).map(invoice => {
        return {
          columns: [{
            content: invoice.status,
            columnSize: 3
          }, {
            content: (
              <a
                href='#invoices/42'>
                {invoice.number}
              </a>),
            columnSize: 3
          }, {
            content: invoice.chargedTo,
            columnSize: 3
          }, {
            content: invoice.date,
            columnSize: 3
          }],
          key: String(invoice.number)
        };
      });
      content = (
        <div>
          <h2 className="profile__title">
            Payment history
          </h2>
          <BasicTable
            headerClasses={['profile__entity-table-header-row']}
            headerColumnClasses={['profile__entity-table-header-column']}
            headers={[{
              content: 'Status',
              columnSize: 3
            }, {
              content: 'Invoice Number',
              columnSize: 3
            }, {
              content: 'Charged to',
              columnSize: 3
            }, {
              content: 'Date',
              columnSize: 3
            }]}
            rowClasses={['profile__entity-table-row']}
            rowColumnClasses={['profile__entity-table-column']}
            rows={rows} />
        </div>);
    }
    return (
      <div className="profile-invoice-list">
        {content}
      </div>);
  }
};

ProfileInvoiceList.propTypes = {
  baseURL: PropTypes.string.isRequired,
  data: PropTypes.array,
  user: PropTypes.string
};

module.exports = ProfileInvoiceList;
