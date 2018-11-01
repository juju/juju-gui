/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const Button = require('../../shared/button/button');

class ProfileCharmstoreLogin extends React.Component {
  /**
    Calls the bakery to get a charm store macaroon.
    @method _interactiveLogin
  */
  _interactiveLogin() {
    const handler = err => {
      if (err) {
        const message = 'Cannot retrieve charm store macaroon';
        console.error(message, err);
        this.props.addNotification({
          title: message,
          message: `${message}: ${err}`,
          level: 'error'
        });
        return;
      }
      this.props.storeUser('charmstore');
    };
    const macaroon = this.props.bakery.storage.get('charmstore');
    if (macaroon) {
      handler(null);
      return;
    }
    this.props.charmstore.getMacaroon((err, macaroon) => {
      handler(err);
    });
  }

  _openStore() {
    this.props.changeState({profile: null, store: ''});
  }

  render() {
    return (
      <div className="profile-charmstore-login">
        <div className="profile-charmstore-login__button">
          <Button action={this._interactiveLogin.bind(this)} type="neutral">
            Login to the charm store
          </Button>
        </div>
        <h4 className="profile__title">No {this.props.type}</h4>
        <p className="profile-charmstore-login__notice">
          You must&nbsp;
          <span
            className="link"
            onClick={this._interactiveLogin.bind(this)}
            role="button"
            tabIndex="0"
          >
            login
          </span>
          &nbsp; to the&nbsp;
          <span
            className="link"
            onClick={this._openStore.bind(this)}
            role="button"
            tabIndex="0"
          >
            charm store
          </span>
          &nbsp; using an Ubuntu One identity (USSO) to view your charms and bundles.
        </p>
      </div>
    );
  }
}

ProfileCharmstoreLogin.propTypes = {
  addNotification: PropTypes.func.isRequired,
  bakery: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  charmstore: shapeup.shape({
    getMacaroon: PropTypes.func.isRequired
  }).isRequired,
  storeUser: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired
};

module.exports = ProfileCharmstoreLogin;
