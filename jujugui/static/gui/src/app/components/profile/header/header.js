/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../../svg-icon/svg-icon');

/** Header React component for use in the Profile component. */
class ProfileHeader extends React.Component {
  constructor() {
    super();
    this.state = {
      user: null,
      userRequested: false
    };
  }

  componentWillMount() {
    this._getUser();
  }

  /**
    Get the identity user.
  */
  _getUser() {
    this.props.getUser(this.props.username, this._getUserCallback.bind(this));
  }

  /**
    Callback for the controller listModelsWithInfo call.
    @param {String} err The error from the request, or null.
    @param {Array} modelList The list of models.
  */
  _getUserCallback(err, user) {
    this.setState({userRequested: true}, () => {
      if (err) {
        console.log('unable to load user:', err);
        return;
      }
      this.setState({user: user});
    });
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
    let content = <span className="profile-header__avatar-overlay"></span>;
    if (user && user.gravatar_id) {
      content = (
        <img alt="Gravatar" className="profile-header__avatar-gravatar"
          src={`https://www.gravatar.com/avatar/${user.gravatar_id}`} />);
    }
    const classes = classNames(
      'profile-header__avatar', {
        'profile-header__avatar--default': !user || !user.gravatar_id,
        // If we haven't yet received a response about the user data, don't
        // return an avatar so that we can avoid a flash of the 'fallback' icon.
        'profile-header__avatar--hidden': !this.state.userRequested
      });
    return (
      <span className={classes}>
        {content}
      </span>);
  }

  render() {
    const user = this.state.user || {};
    return (
      <div className="profile-header twelve-col">
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
        </div>
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
