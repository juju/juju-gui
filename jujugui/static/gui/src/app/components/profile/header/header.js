/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const Spinner = require('../../spinner/spinner');
const SvgIcon = require('../../svg-icon/svg-icon');

/** Header React component for use in the Profile component. */
class ProfileHeader extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      loadingUser: false,
      user: null
    };
  }

  componentWillMount() {
    this._getUser();
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Get the identity user.
  */
  _getUser() {
    this.setState({loadingUser: true}, () => {
      const xhr = this.props.getUser(
        this.props.username, this._getUserCallback.bind(this));
      this.xhrs.push(xhr);
    });
  }

  /**
    Callback for the controller listModelsWithInfo call.
    @param {String} err The error from the request, or null.
    @param {Array} modelList The list of models.
  */
  _getUserCallback(err, user) {
    if (err) {
      const message = 'Could not load the user.';
      console.error(message, err);
      this.props.addNotification({
        title: message,
        message: `${message}: ${err}`,
        level: 'error'
      });
      return;
    }
    this.setState({loadingUser: false, user: user});
  }

  /**
    Handle closing the profile.
  */
  _handleClose() {
    this.props.changeState({
      hash: null,
      profile: null
    });
  }

  /**
    Generate an avatar for the user.
    @returns {Object} The avatar JSX.
  */
  _generateAvatar() {
    const user = this.state.user;
    if (user && user.gravatar_id) {
      return (
        <span className="profile-header__avatar">
          <img alt="Gravatar"
            className="profile-header__avatar-gravatar"
            src={`https://www.gravatar.com/avatar/${user.gravatar_id}`} />
        </span>);
    }
    return (
      <span className="profile-header__avatar profile-header__avatar--default">
        <span className="profile-header__avatar-overlay"></span>
      </span>);
  }

  render() {
    let content;
    if (this.state.loadingUser) {
      content = (<Spinner />);
    } else {
      const user = this.state.user;
      content = (
        <div className="inner-wrapper profile-header__inner">
          <div className="profile-header__close link"
            onClick={this._handleClose.bind(this)}
            role="button"
            tabIndex="0">
            <SvgIcon
              name="close_16"
              size="20" />
          </div>
          {this._generateAvatar()}
          <ul className="profile-header__meta">
            <li>
              <h1 className="profile-header__username">
                {this.props.username}
              </h1>
            </li>
            <li><strong>{user.fullname}</strong></li>
            <li>{user.email}</li>
          </ul>
          <ul className="profile-header__menu">
            <li>
              <h2 className="profile-header__menutitle">
                <a href="/">jaas</a>
              </h2>
            </li>
            <li><a href="https://jujucharms.com/home">Home</a></li>
            <li><a href="https://jujucharms.com/jaas">About JAAS</a></li>
          </ul>
        </div>);
    }
    return (
      <div className="profile-header twelve-col">
        {content}
      </div>);
  }

};

ProfileHeader.propTypes = {
  addNotification: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  getUser: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired
};

module.exports = ProfileHeader;
