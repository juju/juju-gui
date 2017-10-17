/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const shapeup = require('shapeup');

/**
  Charm list React component used to display a list of the users charms in
  their profile.
*/
class ProfileCharmList extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      data: []
    };
  }

  componentWillMount() {
    const user = this.props.user;
    if (user) {
      this._fetchCharms(user);
    }
  }

  componentWillUnmount() {
    this.xhrs.forEach((xhr) => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  componentWillReceiveProps(nextProps) {
    const props = this.props;
    if (props.user !== nextProps.user) {
      this._fetchCharms(nextProps.user);
    }
  }

  /**
    Fetch the users charms from the charmstore.
    @param {String} user The external user name in the format "user@external".
  */
  _fetchCharms(user) {
    const props = this.props;
    this.xhrs.push(
      props.charmstore.list(
        user,
        (error, data) => {
          if (error) {
            const message = 'Unable to retrieve charms';
            console.error(message, error);
            this.props.addNotification({
              title: message,
              message: `${message}: ${error}`,
              level: 'error'
            });
            return;
          }
          this.setState({data});
        },
        'charm'));
  }

  /**
    Prevents the default actions on the link and navigates to the charmstore
    for the supplied id via changeState.
    @param {String} path The GUI charm path to navigate to.
    @param {Object} e The click event.
  */
  _navigateToCharm(path, e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.changeState({profile: null, store: path, hash: null});
  }

  /**
    Process the data required for the charm table.
    @param {Object} charm The charm data.
    @param {String} key The key that stores the data in the charm object.
    @return {String} The string value to display in the table.
  */
  _processData(charm, key) {
    switch(key) {
      case 'name':
        const name = charm[key];
        const id = charm.id;
        const src = `${this.props.charmstore.url}/${id.replace('cs:', '')}/icon.svg`;
        const path = window.jujulib.URL.fromLegacyString(id).path();
        return [
          <img key="img" className="profile-charm-list__icon" src={src} title={name} />,
          <a
            key="link"
            href={`${this.props.baseURL}${path}`}
            onClick={this._navigateToCharm.bind(this, path)}>{name}</a>
        ];
        return;
        break;
      case 'series':
        return charm[key].reduce((list, val) => `${list} ${val}`, '').trim();
        break;
      case 'owner':
        return charm[key] || this.props.user;
      case 'perm':
        const perms = charm[key];
        if (perms && perms.read.includes('everyone')) {
          return 'public';
        }
        return 'private';
      default:
        return charm[key];
    }
    return '';
  }

  render() {
    const labels = ['Name', 'Series', 'Owner', 'Visibility'];
    const charmKeys = ['name', 'series', 'owner', 'perm'];
    return (
      <div className="profile-charm-list">
        <ul>
          <li className="profile-charm-list__table-header">
            {labels.map(label => <span key={label}>{label}</span>)}
          </li>
          {this.state.data
            .map((charm, idx) => (
              <li className="profile-charm-list__row" key={idx}>
                {charmKeys.map(key => <span key={key}>{this._processData(charm, key)}</span>)}
              </li>
            ))}
        </ul>
      </div>);
  }
};

ProfileCharmList.propTypes = {
  addNotification: PropTypes.func.isRequired,
  baseURL: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired,
  charmstore: shapeup.shape({
    list: PropTypes.func.isRequired,
    url: PropTypes.string.isRequired
  }).isRequired,
  user: PropTypes.string
};

module.exports = ProfileCharmList;
