'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

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
    this.props.getUser(this.props.userInfo.profile, this._getUserCallback.bind(this));
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
    const isCurrent = this.props.userInfo.isCurrent;
    let content;
    if (user && user.gravatar_id) {
      content = (
        <img
          alt={`Gravatar for ${user.fullname}`}
          className="p-media-object__image is-round"
          src={`https://www.gravatar.com/avatar/${user.gravatar_id}`} />
      );
    }
    const classes = classNames('profile-header__avatar', {
      tooltip: isCurrent,
      'profile-header__avatar--default': !user || !user.gravatar_id,
      // If we haven't yet received a response about the user data, don't
      // return an avatar so that we can avoid a flash of the 'fallback' icon.
      'profile-header__avatar--hidden': !this.state.userRequested
    });
    const tooltip = isCurrent ? (
      <span
        className="p-tooltip__message"
        id="tp-cntr"
        role="tooltip">
        Edit your Gravatar
      </span>
    ) : null;
    return (
      <span className={classes}>
        {isCurrent ? (
          <a
            aria-describedby="tp-cntr"
            className="p-tooltip p-tooltip--btm-center"
            href="http://gravatar.com/"
            target="_blank">
            {content}
            {tooltip}
          </a>
        ) : (
          content
        )}
      </span>
    );
  }

  /**
    Generates the list of menu items for the header depending on the truthyness
    of the gisf prop.
    @return {Array} The list in JSX.
  */
  _generateControllerDetails() {
    if (!this.props.userInfo.isCurrent) {
      return null;
    }
    let items;
    if (this.props.gisf) {
      items = [
        <li
          className="p-list__item"
          key="controller">
          <h2>
            <a href="/">jaas</a>
          </h2>
          <hr />
        </li>,
        <li
          className="p-list__item"
          key="home">
          <a href="https://jujucharms.com/home">Home</a>
        </li>,
        <li
          className="p-list__item"
          key="aboutjaas">
          <a href="https://jujucharms.com/jaas">About JAAS</a>
        </li>
      ];
    } else {
      items = [
        <li
          className="p-list__item"
          key="controller">
          <h2>{this.props.controllerIP}</h2>
          <hr />
        </li>,
        <li
          className="p-list__item"
          key="home">
          <a href="https://jujucharms.com/about">Juju Home</a>
        </li>
      ];
    }
    return <ul className="p-list ts-profile-header__menu">{items}</ul>;
  }

  render() {
    const user = this.state.user || {};
    return (
      <div className="profile-header">
        <div className="p-strip is-shallow">
          <div className="row profile-header__inner u-no-padding--top u-no-padding--bottom">
            <div>
              <div className="p-media-object--large u-no-margin--bottom">
                {this._generateAvatar()}
                <div className="p-media-object__details">
                  <h1>{this.props.userInfo.profile}</h1>
                  <p className="p-media-object__content">
                    <strong>{user.fullname}</strong>
                  </p>
                  <p className="p-media-object__content">{user.email}</p>
                </div>
              </div>
            </div>
            <div>
              {this._generateControllerDetails()}
              <div
                className="profile-header__close"
                onClick={this._handleClose.bind(this)}
                role="button"
                tabIndex="0">
                <SvgIcon
                  name="close_16"
                  size="20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ProfileHeader.propTypes = {
  changeState: PropTypes.func.isRequired,
  controllerIP: PropTypes.string,
  getUser: PropTypes.func.isRequired,
  gisf: PropTypes.bool,
  userInfo: shapeup.shape({
    isCurrent: PropTypes.bool.isRequired,
    profile: PropTypes.string.isRequired
  }).isRequired
};

module.exports = ProfileHeader;
