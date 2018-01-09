/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const BasicTable = require('../../basic-table/basic-table');
const ProfileExpandedContent = require('../expanded-content/expanded-content');
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
        const url = window.jujulib.URL.fromLegacyString(bundle.id);
        const path = url.path();
        const version = `#${url.revision}`;
        const charmstore = this.props.charmstore;
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
            <ProfileExpandedContent
              acl={this.props.acl}
              changeState={this.props.changeState}
              entity={bundle}
              getDiagramURL={charmstore.getDiagramURL.bind(charmstore)}
              deployTarget={this.props.deployTarget}
              getModelName={this.props.getModelName}
              topRow={(
                <div>
                  <div className="eight-col profile-expanded-content__top-row">
                    {bundle.name}
                  </div>
                  <div className="two-col profile-expanded-content__top-row">
                    {bundle.machineCount}
                  </div>
                  <div className="one-col profile-expanded-content__top-row">
                    {bundle.unitCount}
                  </div>
                  <div className="one-col last-col profile-expanded-content__top-row">
                    {version}
                  </div>
                </div>)} />),
          key: bundle.id
        };
      });
      const prefix = this.props.activeUsersProfile ? 'My' : 'Their';
      content = (
        <div>
          <h2 className="profile__title">
            {prefix} bundles
            <span className="profile__title-count">
              ({(this.state.data || []).length})
            </span>
          </h2>
          <BasicTable
            headerClasses={['profile__entity-table-header-row']}
            headerColumnClasses={['profile__entity-table-header-column']}
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
            rowClasses={['profile__entity-table-row']}
            rowColumnClasses={['profile__entity-table-column']}
            rows={rows} />
        </div>);
    }
    return (
      <div className="profile-bundle-list">
        {content}
      </div>);
  }
};

ProfileBundleList.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired
  }).frozen.isRequired,
  activeUsersProfile: PropTypes.bool,
  addNotification: PropTypes.func.isRequired,
  baseURL: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired,
  charmstore: shapeup.shape({
    getDiagramURL: PropTypes.func.isRequired,
    list: PropTypes.func.isRequired,
    url: PropTypes.string.isRequired
  }).isRequired,
  deployTarget: PropTypes.func.isRequired,
  getModelName: PropTypes.func.isRequired,
  user: PropTypes.string
};

module.exports = ProfileBundleList;
