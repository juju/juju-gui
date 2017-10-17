/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const shapeup = require('shapeup');

/**
  Charm list React component used to display a list of the users bundles in
  their profile.
*/
class ProfileBundleList extends React.Component {
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
      this._fetchBundles(user);
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
      this._fetchBundles(nextProps.user);
    }
  }

  /**
    Fetch the users bundles from the charmstore.
    @param {String} user The external user name in the format "user@external".
  */
  _fetchBundles(user) {
    const props = this.props;
    this.xhrs.push(
      props.charmstore.list(
        user,
        (error, data) => {
          if (error) {
            const message = 'Unable to retrieve bundles';
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
        'bundle'));
  }

  /**
    Prevents the default actions on the link and navigates to the charmstore
    for the supplied id via changeState.
    @param {String} path The GUI bundle path to navigate to.
    @param {Object} e The click event.
  */
  _navigateToBundle(path, e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.changeState({profile: null, store: path, hash: null});
  }

  /**
    Process the data required for the bundle table.
    @param {Object} bundle The bundle data.
    @param {String} key The key that stores the data in the bundle object.
    @return {String} The string value to display in the table.
  */
  _processData(bundle, key) {
    switch(key) {
      case 'name':
        const name = bundle[key];
        // To get the icon for the bundle we take the first application in the
        // list and then use its icon as the icon for the bundle
        let src = '';
        const applications = bundle.applications;
        for (let key in applications) {
          const app = applications[key];
          src = `${this.props.charmstore.url}/${app.charm.replace('cs:', '')}/icon.svg`;
          break;
        }
        const path = window.jujulib.URL.fromLegacyString(bundle.id).path();
        return [
          <img key="img" className="profile-bundle-list__icon" src={src} title={name} />,
          <a
            key="link"
            href={`${this.props.baseURL}${path}`}
            onClick={this._navigateToBundle.bind(this, path)}>{name}</a>
        ];
        return;
        break;
      case 'owner':
        return bundle[key] || this.props.user;
      case 'perm':
        const perms = bundle[key];
        if (perms && perms.read.includes('everyone')) {
          return 'public';
        }
        return 'private';
      default:
        return bundle[key];
    }
    return '';
  }

  render() {
    const labels = ['Name', 'Units', 'Owner', 'Visibility'];
    const bundleKeys = ['name', 'unitCount', 'owner', 'perm'];
    return (
      <div className="profile-bundle-list">
        <ul>
          <li className="profile-bundle-list__table-header">
            {labels.map(label => <span key={label}>{label}</span>)}
          </li>
          {this.state.data
            .map((bundle, idx) => (
              <li className="profile-bundle-list__row" key={idx}>
                {bundleKeys.map(key =>
                  <span key={key}>{this._processData(bundle, key)}</span>)}
              </li>
            ))}
        </ul>
      </div>);
  }
};

ProfileBundleList.propTypes = {
  addNotification: PropTypes.func.isRequired,
  baseURL: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired,
  charmstore: shapeup.shape({
    list: PropTypes.func.isRequired,
    url: PropTypes.string.isRequired
  }).isRequired,
  user: PropTypes.string
};

module.exports = ProfileBundleList;
