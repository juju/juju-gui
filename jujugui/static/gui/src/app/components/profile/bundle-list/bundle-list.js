/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const BasicTable = require('../../basic-table/basic-table');
const EntityContentDiagram = require('../../entity-details/content/diagram/diagram');
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
    Prevents click event passing through and closing the expanding row.
    @param evt {Object} The click event.
  */
  _stopPropagation(evt) {
    evt.stopPropagation();
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
    Navigate to a user profile.
    @param username {String} A username.
  */
  _navigateToProfile(username) {
    this.props.changeState({
      hash: null,
      profile: username
    });
  }

  /**
    Generate a list of permissions.
    @param permissions {Array} The list of permissions.
    @returns {Object} The list as JSX.
  */
  _generatePermissions(permissions) {
    let items = permissions.map(username => {
      if (username === 'everyone') {
        return (
          <li className="profile-bundle-list__permission"
            key={username}>
            {username}
          </li>);
      }
      return (
        <li className="profile-bundle-list__permission link"
          key={username}
          onClick={this._navigateToProfile.bind(this, username)}
          role="button"
          tabIndex="0">
          {username}
        </li>);
    });
    if (items.length === 0) {
      items = (
        <li className="profile-bundle-list__permission"
          key="none">
          None
        </li>);
    }
    return (
      <ul className="profile-bundle-list__permissions">
        {items}
      </ul>);
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
        const url = window.jujulib.URL.fromLegacyString(bundle.id);
        const path = url.path();
        const version = `#${url.revision}`;
        return {
          columns: [{
            content: (
              <a className="cold-link"
                href={`${this.props.baseURL}${path}`}
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
            content: version,
            columnSize: 1
          }],
          expandedContent: (
            <div className="profile-bundle-list__expanded">
              <div className="eight-col profile-bundle-list__expanded-leading">
                {bundle.name}
              </div>
              <div className="two-col profile-bundle-list__expanded-leading">
                {bundle.machineCount}
              </div>
              <div className="one-col profile-bundle-list__expanded-leading">
                {bundle.unitCount}
              </div>
              <div className="one-col last-col profile-bundle-list__expanded-leading">
                {version}
              </div>
              <div className="seven-col">
                <p>{bundle.description}</p>
                <EntityContentDiagram
                  diagramUrl={this.props.charmstore.getDiagramURL(bundle.id)} />
              </div>
              <div className="five-col last-col">
                <div>
                  <a href={bundle.bugUrl}
                    onClick={this._stopPropagation.bind(this)}
                    target="_blank">
                    Bugs
                  </a>
                </div>
                <div>
                  <a href={bundle.homepage}
                    onClick={this._stopPropagation.bind(this)}
                    target="_blank">
                    Homepage
                  </a>
                </div>
                <p className="profile-bundle-list__permissions-title">
                  Writeable:
                </p>
                {this._generatePermissions(bundle.perm.write)}
                <p className="profile-bundle-list__permissions-title">
                  Readable:
                </p>
                {this._generatePermissions(bundle.perm.read)}
              </div>
            </div>),
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
    getDiagramURL: PropTypes.func.isRequired,
    list: PropTypes.func.isRequired,
    url: PropTypes.string.isRequired
  }).isRequired,
  user: PropTypes.string
};

module.exports = ProfileBundleList;
