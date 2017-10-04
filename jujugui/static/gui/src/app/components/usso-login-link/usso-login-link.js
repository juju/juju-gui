/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../generic-button/generic-button');

class USSOLoginLink extends React.Component {
  /**
    Handle the login form the user click.
  */
  handleLogin(e) {
    if (e && e.preventDefault) {
      // Depending on the login link type there may or may not be a
      // preventDefault method.
      e.preventDefault();
    }
    this.props.loginToController(err => {
      if (err) {
        const message = 'cannot log into the controller';
        this.props.addNotification({
          title: message,
          message: `${message}: ${err}`,
          level: 'error'
        });
        console.error(message, err);
      }

      const callback = this.props.callback;
      if (callback) {
        callback(err);
      }
    });
  }

  /**
    If the component has child elements, they are used as the content for the
    link; otherwise the provided default string will be used.

    @param {String} defaultContent The default content to use for the button
                                   or link.
  */
  _generateContent(defaultContent) {
    if (this.props.children) {
      return this.props.children;
    } else {
      return defaultContent;
    }
  }

  /**
    Returns the text login link.
  */
  _renderTextLink() {
    return (
      <a className="usso-login__action"
        onClick={this.handleLogin.bind(this)}
        target="_blank">
        {this._generateContent('Login')}
      </a>);
  }

  /**
    Returns the button login link.
  */
  _renderButtonLink() {
    return (
      <GenericButton
        action={this.handleLogin.bind(this)}
        extraClasses="usso-login__action"
        type="positive">
        {this._generateContent('Sign up/Log in with USSO')}
      </GenericButton>
    );
  }

  render() {
    const notification = `If requested,
      in the address bar above, please allow popups
      from ${window.location.origin}.`;
    let ele;
    if (this.props.displayType === 'button') {
      ele = this._renderButtonLink();
    } else {
      ele = this._renderTextLink();
    }
    return(
      <div className="usso-login">
        {ele}
        <div className="usso-login__notification">
          {notification}
        </div>
      </div>);
  }
};

USSOLoginLink.propTypes = {
  addNotification: PropTypes.func.isRequired,
  callback: PropTypes.func,
  children: PropTypes.node,
  displayType: PropTypes.string.isRequired,
  gisf: PropTypes.bool,
  loginToController: PropTypes.func.isRequired
};

module.exports = USSOLoginLink;
