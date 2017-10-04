/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const Spinner = require('../../spinner/spinner');
const DateDisplay = require('../../date-display/date-display');

class UserProfileAgreementList extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      agreementList: [],
      loadingAgreements: false
    };
  }

  componentWillMount() {
    this._getAgreements();
  }

  componentWillUnmount() {
    this.xhrs.forEach((xhr) => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  componentWillReceiveProps(nextProps) {
    // If the user has changed then update the data.
    const props = this.props;
    const currentUser = props.user && props.user.user;
    const nextUser = nextProps.user && nextProps.user.user;
    if (nextUser !== currentUser) {
      this._getAgreements();
    }
  }

  /**
    Get the agreements for the authenticated user.

    @method _getAgreements
  */
  _getAgreements() {
    // Delay the call until after the state change to prevent race
    // conditions.
    this.setState({loadingAgreements: true}, () => {
      const xhr = this.props.getAgreements(
        this._getAgreementsCallback.bind(this));
      this.xhrs.push(xhr);
    });
  }

  /**
    Callback for the terms API call to get agreements.

    @method _getAgreementsCallback
    @param {String} error The error from the request, or null.
    @param {Object} data The data from the request.
  */
  _getAgreementsCallback(error, data) {
    this.setState({loadingAgreements: false}, () => {
      if (error) {
        const message = 'Cannot retrieve terms';
        console.error(message, error);
        this.props.addNotification({
          title: message,
          message: `${message}: ${error}`,
          level: 'error'
        });
        return;
      }
      this.setState({agreementList: data});
    });
  }

  /**
    Generate the details for the provided agreement.

    @method _generateRow
    @param {Object} agreement A agreement object.
    @returns {Array} The markup for the row.
  */
  _generateRow(agreement) {
    const term = agreement.term;
    return (
      <li className="user-profile__list-row twelve-col"
        key={term + agreement.revision}>
        <span className="user-profile__list-col eight-col">
          {term}
        </span>
        <span className="user-profile__list-col four-col last-col">
          <DateDisplay
            date={agreement.createdAt}
            relative={true} />
        </span>
      </li>);
  }

  /**
    Generate the header for the agreements.

    @method _generateHeader
    @returns {Array} The markup for the header.
  */
  _generateHeader() {
    return (
      <li className="user-profile__list-header twelve-col">
        <span className="user-profile__list-col eight-col">
          Name
        </span>
        <span className="user-profile__list-col four-col last-col">
          Date signed
        </span>
      </li>);
  }

  render() {
    if (this.state.loadingAgreements) {
      return (
        <div className="user-profile__agreement-list twelve-col">
          <Spinner />
        </div>
      );
    }
    const list = this.state.agreementList;
    if (!list || list.length === 0) {
      return null;
    }
    const rows = list.map(this._generateRow.bind(this));
    return (
      <div className="user-profile__agreement-list">
        <div className="user-profile__header twelve-col no-margin-bottom">
          Terms &amp; conditions
          <span className="user-profile__size">
            ({list.length})
          </span>
        </div>
        <ul className="user-profile__list twelve-col">
          {this._generateHeader()}
          {rows}
        </ul>
      </div>
    );
  }
};

UserProfileAgreementList.propTypes = {
  addNotification: PropTypes.func.isRequired,
  getAgreements: PropTypes.func.isRequired,
  user: PropTypes.object
};

module.exports = UserProfileAgreementList;
