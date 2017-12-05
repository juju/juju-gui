/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const BasicTable = require('../../basic-table/basic-table');
const Spinner = require('../../spinner/spinner');

/**
  Charm list React component used to display a list of the users bundles in
  their profile.
*/
class ProfileBundleList extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      data: [],
      loading: false
    };
  }

  componentWillMount() {
    const user = this.props.user;
    if (user) {
      this._fetchBundles(user);
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
      this._fetchBundles(nextProps.user);
    }
  }

  /**
    Fetch the users bundles from the charmstore.
    @param {String} user The external user name in the format "user@external".
  */
  _fetchBundles(user) {
    const props = this.props;
    this.setState({loading: true}, () => {
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
            this.setState({
              data,
              loading: false
            });
          },
          'bundle'));
    });
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

  render() {
    let content;
    if (this.state.loading) {
      content = (<Spinner />);
    } else {
      const rows = (this.state.data || []).map(bundle => {
        const applications = bundle.applications;
        const icons = Object.keys(applications).map(name => {
          const app = applications[name];
          return (
            <img className="profile-bundle-list__icon"
              key={name}
              src={`${this.props.charmstore.url}/${app.charm.replace('cs:', '')}/icon.svg`}
              title={name} />);
        });
        const path = window.jujulib.URL.fromLegacyString(bundle.id).path();
        return {
          columns: [{
            content: (
              <a href={`${this.props.baseURL}${path}`}
                onClick={this._navigateToBundle.bind(this, path)}>
                {bundle.name}
              </a>),
            columnSize: 4
          }, {
            content: (
              <div>
                {icons}
              </div>),
            columnSize: 4
          }, {
            content: bundle.machineCount,
            columnSize: 2
          }, {
            content: bundle.unitCount,
            columnSize: 1
          }, {
            content: `#${bundle.id.slice(-1)[0]}`,
            columnSize: 1
          }],
          key: bundle.id
        };
      });
      content = (
        <BasicTable
          headers={[{
            content: 'Name',
            columnSize: 8
          }, {
            content: 'Machines',
            columnSize: 2
          }, {
            content: 'Units',
            columnSize: 1
          }, {
            content: 'Release',
            columnSize: 1
          }]}
          rows={rows} />);
    }
    return (
      <div className="profile-bundle-list">
        {content}
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
